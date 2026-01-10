# Project Context: Blackhole Vault

## Overview
**Blackhole Vault** is a secure, client-side encrypted password manager built with **Next.js 16**. It utilizes a zero-knowledge architecture where all encryption and decryption occur in the browser using the Web Crypto API. The server only stores encrypted data blobs, ensuring complete data privacy.

## Tech Stack
*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Database:** MongoDB (via Mongoose)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Authentication:** Custom session-based auth (`iron-session`)
*   **Cryptography:** Web Crypto API (AES-GCM, PBKDF2)
*   **Testing:** Vitest, React Testing Library

## Key Features
*   **Zero-Knowledge:** Client-side encryption ensures the server never sees plaintext data.
*   **Security:** AES-GCM 256-bit encryption, PBKDF2 key derivation (250k iterations).
*   **Vault Management:** Secure storage for passwords, API keys, and notes.
*   **UI/UX:** Modern "void" aesthetic, drag-and-drop organization, auto-logout.

## Architecture

### Directory Structure
*   `src/app/`: Next.js App Router pages and API routes.
*   `src/components/`: React components (UI and Feature-specific).
*   `src/lib/`: Core logic (Crypto, Database, Session).
*   `src/models/`: Mongoose data models (`User`, `Vault`).
*   `src/context/`: React Context (Global state).

### Security Model (`src/lib/crypto.ts`)
1.  **Key Derivation:** `PBKDF2` (SHA-256, 250,000 iterations) derives a Key Encryption Key (KEK) from the user's master password and a salt.
2.  **Encryption:** `AES-GCM` (256-bit) encrypts the vault JSON data.
3.  **Storage:** The server stores only the `ciphertext`, `iv`, `salt`, and KDF parameters.

### Data Model
*   **User:** Stores username and authentication credentials (hashed).
*   **Vault:** Stores the encrypted blob (`ciphertext`, `iv`, `salt`) associated with a user.

## Development Workflow

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance

### Setup & Run
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables (`.env`):**
    ```env
    DATABASE_URL=mongodb://...
    SESSION_PASSWORD=... (32+ chars)
    ```
3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
4.  **Run Tests:**
    ```bash
    npx vitest
    ```

### Building for Production
```bash
npm run build
npm start
```

## Conventions
*   **Code Style:** Adhere to existing TypeScript and Tailwind patterns.
*   **Testing:** Write unit tests for critical logic (especially crypto) in `*.test.ts` files using Vitest.
*   **Safety:** **NEVER** log or expose plaintext passwords or encryption keys. Ensure all crypto operations happen client-side or in secure contexts.
