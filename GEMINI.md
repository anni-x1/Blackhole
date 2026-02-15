# GEMINI.md - Blackhole Vault Context

## Project Overview
Blackhole Vault is a secure, client-side encrypted password manager and vault built with Next.js. It implements a **zero-knowledge architecture**, ensuring that sensitive data is encrypted and decrypted exclusively in the browser using the Web Crypto API. The server only stores encrypted blobs and never has access to plaintext data or master passwords.

### Main Technologies
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Framer Motion
- **Cryptography:** Web Crypto API (AES-GCM 256-bit, PBKDF2-SHA256 with 250k iterations)
- **Database:** MongoDB (via Mongoose)
- **Session Management:** `iron-session` with server-side validation for single-session enforcement.
- **Testing:** Vitest & React Testing Library

## Building and Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
# Run tests once
npx vitest run

# Run tests in watch mode
npx vitest
```

### Linting
```bash
npm run lint
```

## Architecture & Key Concepts

### Cryptographic Workflow
The project uses a **Dual-Key Derivation** strategy:
1.  **Passphrase + Salt** → PBKDF2 → `keyVault`: Used for AES-GCM encryption/decryption of the vault data. This key **never** leaves the browser.
2.  **Passphrase + XORed Salt** → PBKDF2 → `keyAuth`: Exported and sent to the server for authentication (where it is hashed before storage).

### Vault Structure
The vault is stored as a `VaultEnvelope` containing:
- `ciphertext`: Base64 encoded encrypted JSON.
- `iv`: Initialization Vector (96-bit).
- `salt`: PBKDF2 salt.
- `kdfParams`: Details about iterations and algorithm.

### Session Enforcement
- Every API request validates the session against the database.
- Only one active session per user is allowed; a new login invalidates previous sessions.
- Automatic logout occurs after 3 minutes of inactivity or browser closure.

## Development Conventions

### Coding Style
- **Components:** Modular React components in `src/components/`. UI-specific components in `src/components/ui/`.
- **State Management:** The `VaultProvider` in `src/context/VaultContext.tsx` handles the lifecycle of the unlocked vault and key management.
- **API Routes:** Located in `src/app/api/`. Uses `validateAndRefreshSession` middleware for protected routes.
- **Cryptography:** All cryptographic logic must reside in `src/lib/crypto.ts` and use the native Web Crypto API.

### Testing Practices
- Unit tests for logic (especially crypto) are located alongside source files (e.g., `src/lib/crypto.test.ts`).
- Uses `jsdom` environment for Vitest.
- Mocking is used for server-side dependencies when testing frontend components.

### Security Reminders
- **NEVER** log or transmit the `keyVault`.
- **NEVER** store the master password in local storage or cookies.
- Ensure all new API routes are protected by checking the session and validating it against the database.
