import { PlaintextVault, VaultEnvelope } from '../types/vault';

// --- Configuration Constants ---
export const PBKDF2_ITERATIONS = 600000;
export const SALT_LENGTH = 16; // bytes
export const IV_LENGTH = 12; // bytes (96 bits for AES-GCM)
export const KEY_LENGTH = 256; // bits
export const HASH_ALGO = 'SHA-256';

// --- Helpers ---

export function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function safeZero(buffer: ArrayBuffer | Uint8Array | null | undefined) {
  if (!buffer) return;
  if (buffer instanceof Uint8Array) {
    buffer.fill(0);
  } else if (buffer instanceof ArrayBuffer) {
    new Uint8Array(buffer).fill(0);
  }
}

// --- Core Crypto Functions ---

function getSubtleCrypto() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  throw new Error('Web Crypto API is not available. Ensure you are using a modern browser and accessing the app via a Secure Context (HTTPS or localhost).');
}

/**
 * Derives a cryptographic key from a passphrase and salt using PBKDF2.
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  extractable: boolean = false
): Promise<CryptoKey> {
  const crypto = getSubtleCrypto();
  const enc = new TextEncoder();
  const passphraseBytes = enc.encode(passphrase);
  
  try {
    const passphraseKey = await crypto.importKey(
      'raw',
      passphraseBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Zero out the raw passphrase bytes immediately after importing it
    safeZero(passphraseBytes);

    return await crypto.deriveKey(
      {
        name: 'PBKDF2',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        salt: salt as any,
        iterations: PBKDF2_ITERATIONS,
        hash: HASH_ALGO,
      },
      passphraseKey,
      { name: 'AES-GCM', length: KEY_LENGTH },
      extractable, 
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    safeZero(passphraseBytes);
    throw error;
  }
}

/**
 * Encrypts the plaintext vault.
 * Generates a new IV for every encryption.
 */
export async function encryptVault(
  key: CryptoKey,
  vaultData: PlaintextVault,
  saltBase64: string, // Keep the same salt used for derivation
  existingCreatedAt?: string
): Promise<VaultEnvelope> {
  const crypto = getSubtleCrypto();
  const enc = new TextEncoder();
  const plaintext = JSON.stringify(vaultData);
  const encodedData = enc.encode(plaintext);

  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  try {
    const ciphertextBuffer = await crypto.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    const now = new Date().toISOString();
    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

    // Zero out sensitive data arrays immediately after use
    safeZero(encodedData);
    safeZero(iv);
    safeZero(ciphertextBuffer);

    return {
      version: 1,
      kdf: 'PBKDF2',
      iterations: PBKDF2_ITERATIONS,
      salt: saltBase64,
      iv: ivBase64,
      ciphertext: ciphertextBase64,
      createdAt: existingCreatedAt || now,
      updatedAt: now,
    };
  } catch (error) {
    safeZero(encodedData);
    safeZero(iv);
    throw error;
  }
}

/**
 * Decrypts the vault envelope.
 */
export async function decryptVault(
  key: CryptoKey,
  envelope: VaultEnvelope
): Promise<PlaintextVault> {
  const crypto = getSubtleCrypto();
  const iv = base64ToArrayBuffer(envelope.iv);
  const ciphertext = base64ToArrayBuffer(envelope.ciphertext);

  try {
    const decryptedBuffer = await crypto.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      new Uint8Array(ciphertext)
    );

    const dec = new TextDecoder();
    const plaintext = dec.decode(decryptedBuffer);
    const parsed = JSON.parse(plaintext) as PlaintextVault;

    // Zero out sensitive data arrays immediately after use
    safeZero(iv);
    safeZero(ciphertext);
    safeZero(decryptedBuffer);

    return parsed;
  } catch (error) {
    safeZero(iv);
    safeZero(ciphertext);
    throw error;
  }
}

/**
 * Generates a new random salt.
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generates a strong UUID.
 */
export function generateUUID(): string {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  // Gracefully fallback to Node's native require('crypto').randomUUID() structure if in serverless/SSR scope
  if (typeof require !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('crypto');
      if (nodeCrypto && typeof nodeCrypto.randomUUID === 'function') {
        return nodeCrypto.randomUUID();
      }
    } catch {
      // Suppress dynamic require error in non-Node environments
    }
  }

  // Manual RFC 4122 v4 fallback
  const hex: string[] = [];
  const bytes = new Uint8Array(16);

  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    typeof window.crypto.getRandomValues === 'function'
  ) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  for (let i = 0; i < 16; i++) {
    hex.push(bytes[i].toString(16).padStart(2, '0'));
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
