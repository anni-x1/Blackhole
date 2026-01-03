'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { PlaintextVault, VaultEntry, VaultEnvelope } from '../types/vault';
import { deriveKey, decryptVault, encryptVault, generateSalt, arrayBufferToBase64, base64ToArrayBuffer } from '../lib/crypto';

interface User {
  email: string;
}

interface VaultContextType {
  user: User | null;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  vaultData: PlaintextVault | null;
  isSetupMode: boolean; 
  login: (email: string, passcode: string) => Promise<boolean>;
  register: (email: string, passcode: string) => Promise<boolean>;
  lock: () => void;
  logout: () => Promise<void>;
  saveVault: (newData: PlaintextVault) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const AUTO_LOCK_TIMEOUT_MS = 3 * 60 * 1000;

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<PlaintextVault | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Check session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/vault');
        if (res.ok) {
          const data = await res.json();
          // We are logged in but vault is still locked
          setIsUnlocked(false);
          setIsSetupMode(false);
        } else if (res.status === 404) {
          // Logged in but no vault exists yet
          setIsSetupMode(true);
        }
      } catch (e) {
        // Not logged in or network error
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Auto-lock logic
  useEffect(() => {
    if (!isUnlocked) return;
    const resetTimer = () => { lastActivityRef.current = Date.now(); };
    
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keydown', resetTimer);

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > AUTO_LOCK_TIMEOUT_MS) logout();
    }, 1000);

    return () => {
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearInterval(interval);
    };
  }, [isUnlocked]);

  /**
   * Derives two keys: 
   * 1. keyAuth: Sent to server for login (hashed on server).
   * 2. keyVault: Stays in browser for decryption.
   */
  const deriveDualKeys = async (passcode: string, salt: Uint8Array) => {
    const keyVault = await deriveKey(passcode, salt);
    
    // For Key_Auth, we derive another key using a slightly modified salt 
    // to ensure the auth key and vault key are cryptographically distinct.
    const authSalt = new Uint8Array(salt.length);
    for(let i=0; i<salt.length; i++) authSalt[i] = salt[i] ^ 0xFF; 
    
    // keyAuth must be extractable so we can send it to the server
    const keyAuthRaw = await deriveKey(passcode, authSalt, true);
    // Export keyAuth as base64 to send to server
    const exportedAuth = await window.crypto.subtle.exportKey('raw', keyAuthRaw);
    const keyAuthB64 = arrayBufferToBase64(exportedAuth);
    
    return { keyVault, keyAuthB64 };
  };

  const register = async (email: string, passcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const salt = generateSalt();
      const saltB64 = arrayBufferToBase64(salt.buffer);
      const { keyVault, keyAuthB64 } = await deriveDualKeys(passcode, salt);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, authSalt: saltB64, keyAuth: keyAuthB64 })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      setUser({ email });
      keyRef.current = keyVault;
      saltRef.current = saltB64;
      
      // Initialize empty vault
      const emptyVault: PlaintextVault = {
        passwords: [], apis: [], playground: { scratch: '' }, meta: { version: 1 }
      };
      await saveVault(emptyVault);
      
      setIsUnlocked(true);
      setIsSetupMode(false);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, passcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get user's salt
      const saltRes = await fetch('/api/auth/salt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!saltRes.ok) throw new Error('Invalid email or passcode');
      const { salt: saltB64 } = await saltRes.json();
      const salt = new Uint8Array(base64ToArrayBuffer(saltB64));

      // 2. Derive keys
      const { keyVault, keyAuthB64 } = await deriveDualKeys(passcode, salt);

      // 3. Login to server
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, keyAuth: keyAuthB64 })
      });
      if (!loginRes.ok) throw new Error('Invalid email or passcode');

      setUser({ email });
      keyRef.current = keyVault;
      saltRef.current = saltB64;

      // 4. Fetch and decrypt vault
      const vaultRes = await fetch('/api/vault');
      if (vaultRes.ok) {
        const { vault: envelope } = await vaultRes.json();
        const plaintext = await decryptVault(keyVault, envelope);
        setVaultData(plaintext);
        setIsUnlocked(true);
      } else if (vaultRes.status === 404) {
        setIsSetupMode(true);
      }
      
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const lock = () => {
    setIsUnlocked(false);
    setVaultData(null);
    keyRef.current = null;
    // Note: we keep 'user' logged in at the session level, 
    // just the vault is locked in UI.
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    lock();
    setUser(null);
    setIsSetupMode(false);
  };

  const saveVault = async (newData: PlaintextVault) => {
    if (!keyRef.current || !saltRef.current) throw new Error('Vault locked');
    setVaultData(newData);
    const envelope = await encryptVault(keyRef.current, newData, saltRef.current);
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault: envelope })
    });
  };

  return (
    <VaultContext.Provider value={{
      user, isUnlocked, isLoading, error, vaultData, isSetupMode,
      login, register, lock, logout, saveVault
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within VaultProvider');
  return context;
};