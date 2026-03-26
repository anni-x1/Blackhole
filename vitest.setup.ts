import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Polyfills
import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any;

import { webcrypto } from 'node:crypto';
if (!global.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.crypto = webcrypto as any;
}
// If using JSDOM, it might have a partial crypto, so we might need to override.
// For now, assume JSDOM + Node 20 works or we rely on node:crypto.

Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true
});

afterEach(() => {
  cleanup();
});
