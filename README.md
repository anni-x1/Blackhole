# Blackhole Vault

Blackhole Vault is a secure, client-side encrypted password manager and vault built with Next.js. It follows a zero-knowledge architecture where encryption and decryption happen exclusively in the browser, ensuring the server only ever stores encrypted blobs.

## Features

- **Zero-Knowledge Encryption:** Your data is encrypted using AES-GCM (256-bit) before it ever leaves your device. The server never sees your plaintext data or your master password.
- **Secure Key Derivation:** Keys are derived from your passphrase using PBKDF2-SHA256 with 250,000 iterations.
- **Client-Side Security:** Utilizing the Web Crypto API for robust, native cryptographic operations.
- **Vault Management:**
    - Store and manage **Passwords** for various services.
    - Securely store **API Keys** and notes.
    - **Playground:** An encrypted scratchpad for sensitive temporary text.
- **Modern UI:** Built with Tailwind CSS, Framer Motion, and a dark "void" aesthetic.
- **Responsive Design:** Optimized for both desktop and mobile use.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Cryptography:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- **Database:** MongoDB (via Mongoose)
- **Testing:** [Vitest](https://vitest.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/blackhole-vault.git
    cd blackhole-vault
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory and add the following variables:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    SESSION_SECRET=a_very_long_random_string_at_least_32_chars
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Security Architecture

1.  **Encryption Key:** When you enter your passphrase, a cryptographic key is derived using `PBKDF2` (SHA-256, 250k iterations) with a unique salt.
2.  **Encryption:** Your vault data (passwords, API keys, etc.) is serialized to JSON and encrypted using `AES-GCM` with a random 96-bit IV.
3.  **Storage:** Only the encrypted `ciphertext`, `iv`, `salt`, and `kdf` parameters are sent to the server.
4.  **Decryption:** Upon retrieval, the encrypted blob is downloaded to the client. The client re-derives the key (or uses the session-cached key) to decrypt the blob locally.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint checks.

## License

This project is licensed under the MIT License.
