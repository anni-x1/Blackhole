import { PlaintextVault, VaultEnvelope } from '../types/vault';

// --- Configuration Constants ---
export const PBKDF2_ITERATIONS = 250000;
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
  const passphraseKey = await crypto.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    passphraseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    extractable, 
    ['encrypt', 'decrypt']
  );
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

  const ciphertextBuffer = await crypto.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  const now = new Date().toISOString();

  return {
    version: 1,
    kdf: 'PBKDF2',
    iterations: PBKDF2_ITERATIONS,
    salt: saltBase64,
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    createdAt: existingCreatedAt || now,
    updatedAt: now,
  };
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

  const decryptedBuffer = await crypto.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const plaintext = dec.decode(decryptedBuffer);
  return JSON.parse(plaintext) as PlaintextVault;
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
    return crypto.randomUUID();
}
