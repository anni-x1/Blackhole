import { describe, it, expect } from 'vitest';
import { deriveKey, encryptVault, decryptVault, generateSalt, arrayBufferToBase64 } from './crypto';
import { PlaintextVault } from '@/types/vault';

describe('Crypto Lib', () => {
    it('should generate a salt of correct length', () => {
        const salt = generateSalt();
        expect(salt.length).toBe(16);
    });

    it('should derive a key and encrypt/decrypt a vault', async () => {
        const passcode = 'test-pass';
        const salt = generateSalt();
        const saltB64 = arrayBufferToBase64(salt.buffer);

        const key = await deriveKey(passcode, salt);
        expect(key).toBeDefined();

        const data: PlaintextVault = {
            passwords: [{
                id: '1', service: 'Test', createdAt: '', updatedAt: '',
                password: 'secret-pass',
            }],
            apis: [],
            playground: { scratch: '' },
            meta: { version: 1 }
        };

        const envelope = await encryptVault(key, data, saltB64);
        
        expect(envelope.ciphertext).toBeDefined();
        expect(envelope.iv).toBeDefined();
        expect(envelope.salt).toBe(saltB64);

        const decrypted = await decryptVault(key, envelope);
        expect(decrypted.passwords[0].service).toBe('Test');
        expect(decrypted.passwords[0].password).toBe('secret-pass');
    });
});
