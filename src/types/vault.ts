export interface VaultEntry {
  id: string;
  service: string;
  username?: string;
  password?: string;
  apikey?: string; // used in API entries
  remarks?: string;
  custom?: Record<string, string>;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PlaygroundData {
  scratch: string;
}

export interface VaultMeta {
  version: number;
}

export interface PlaintextVault {
  passwords: VaultEntry[];
  apis: VaultEntry[];
  playground: PlaygroundData;
  meta: VaultMeta;
}

export interface VaultEnvelope {
  version: number;
  kdf: 'PBKDF2' | 'Argon2'; // defaulting to PBKDF2 per requirements
  iterations: number;
  salt: string; // base64
  iv: string;   // base64
  ciphertext: string; // base64
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
