'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { PlaintextVault, VaultEnvelope } from '../types/vault';
import { deriveKey, decryptVault, encryptVault, generateSalt, arrayBufferToBase64, base64ToArrayBuffer } from '../lib/crypto';
import type { EncryptedVaultExport } from '@/lib/vault-transfer';

interface User {
  email: string;
  username?: string;
}

interface VaultContextType {
  user: User | null;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  vaultData: PlaintextVault | null;
  isSetupMode: boolean;
  login: (emailOrUsername: string, passcode: string) => Promise<boolean>;
  register: (email: string, username: string, passcode: string) => Promise<boolean>;
  lock: () => void;
  logout: () => Promise<void>;
  saveVault: (newData: PlaintextVault) => Promise<void>;
  exportEncryptedVault: () => Promise<EncryptedVaultExport>;
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
  const vaultVersionRef = useRef<number | undefined>(undefined);
  const lastActivityRef = useRef<number>(Date.now());

  const clearSessionState = useCallback(() => {
    setUser(null);
    setIsUnlocked(false);
    setIsSetupMode(false);
    setVaultData(null);
    keyRef.current = null;
    saltRef.current = null;
    vaultVersionRef.current = undefined;
  }, []);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser({ email: data.email, username: data.username });
        setIsUnlocked(false);
        setIsSetupMode(false);
        const vaultRes = await fetch('/api/vault', { credentials: 'include' });
        if (vaultRes.ok) {
          // Has vault; stay locked until passcode
        } else if (vaultRes.status === 401) {
          clearSessionState();
        } else if (vaultRes.status === 404) {
          setIsSetupMode(true);
        }
        return true;
      }
      if (res.status === 401) clearSessionState();
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionState]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isUnlocked) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetch('/api/auth/session', { credentials: 'include' })
          .then((res) => { if (res.status === 401) clearSessionState(); });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isUnlocked, clearSessionState]);

  const lock = () => {
    setIsUnlocked(false);
    setVaultData(null);
    keyRef.current = null;
  };

  const logout = useCallback(async () => {
    lock();
    setUser(null);
    setIsSetupMode(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Offline or server error: local state already cleared
    }
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
  }, [isUnlocked, logout]);

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

  const register = async (email: string, username: string, passcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const salt = generateSalt();
      const saltB64 = arrayBufferToBase64(salt.buffer);
      const { keyVault, keyAuthB64 } = await deriveDualKeys(passcode, salt);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: username.trim(), authSalt: saltB64, keyAuth: keyAuthB64 })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      const data = await res.json();
      setUser({ email: data.email, username: data.username });
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, passcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const identifier = emailOrUsername.trim();
      if (!identifier) throw new Error('Enter your email or username');

      const saltRes = await fetch('/api/auth/salt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: identifier })
      });
      if (!saltRes.ok) throw new Error('Invalid email, username or passcode');
      const { salt: saltB64 } = await saltRes.json();
      const salt = new Uint8Array(base64ToArrayBuffer(saltB64));

      const { keyVault, keyAuthB64 } = await deriveDualKeys(passcode, salt);

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: identifier, keyAuth: keyAuthB64 })
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json();
        throw new Error(errorData.error || 'Invalid email, username or passcode');
      }

      const loginData = await loginRes.json();
      setUser({ email: loginData.email, username: loginData.username });
      keyRef.current = keyVault;
      saltRef.current = saltB64;

      // 4. Fetch and decrypt vault
      const vaultRes = await fetch('/api/vault');
      if (vaultRes.ok) {
        const { vault: envelope } = await vaultRes.json();
        const plaintext = await decryptVault(keyVault, envelope);
        vaultVersionRef.current = envelope.version;
        setVaultData(plaintext);
        setIsUnlocked(true);
      } else if (vaultRes.status === 404) {
        // Automatically initialize empty vault for existing user without vault
        const emptyVault: PlaintextVault = {
            passwords: [], apis: [], playground: { scratch: '' }, meta: { version: 1 }
        };
        await saveVault(emptyVault);
        setIsUnlocked(true);
        setIsSetupMode(false);
      }
      
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveVault = async (newData: PlaintextVault) => {
    if (!keyRef.current || !saltRef.current) throw new Error('Vault locked');
    const envelope = await encryptVault(keyRef.current, newData, saltRef.current);
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault: envelope, version: vaultVersionRef.current }),
      credentials: 'include',
    });

    if (res.status === 401) {
      clearSessionState();
      setError('Session expired or active on another device. Please sign in again.');
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Failed to save vault');
    }

    const data = await res.json();
    if (typeof data.version !== 'number') {
      throw new Error('Vault save response was invalid');
    }

    vaultVersionRef.current = data.version;
    setVaultData({ ...newData, meta: { ...newData.meta, version: data.version } });
  };

  const exportEncryptedVault = async (): Promise<EncryptedVaultExport> => {
    if (!keyRef.current || !saltRef.current || !vaultData) {
      throw new Error('Vault locked');
    }

    const envelope: VaultEnvelope = await encryptVault(keyRef.current, vaultData, saltRef.current);

    return {
      format: 'blackhole-vault-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      vault: envelope,
    };
  };

  return (
    <VaultContext.Provider value={{
      user, isUnlocked, isLoading, error, vaultData, isSetupMode,
      login, register, lock, logout, saveVault, exportEncryptedVault
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
