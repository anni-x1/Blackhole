# Blackhole Vault

Blackhole Vault is a secure, client-side encrypted password manager and vault built with Next.js. It follows a zero-knowledge architecture where encryption and decryption happen exclusively in the browser, ensuring the server only ever stores encrypted blobs.

## 🚀 Features

- **Zero-Knowledge Encryption:** Your data is encrypted using AES-GCM (256-bit) before it ever leaves your device. The server never sees your plaintext data or your master password.
- **Secure Key Derivation:** Keys are derived from your passphrase using PBKDF2-SHA256 with 250,000 iterations.
- **Client-Side Security:** Utilizing the Web Crypto API for robust, native cryptographic operations.
- **Vault Management:**
    - Store and manage **Passwords** for various services.
    - Securely store **API Keys** and notes.
    - **Drag & Drop Reordering:** Organize your passwords and API keys by simply dragging them into your preferred order.
    - **Playground:** An encrypted scratchpad for sensitive temporary text.
- **Enhanced Privacy & UX:**
    - **Smart Auto-Logout:** Automatically logs you out after 3 minutes of inactivity or when you close the browser.
    - **Focus Friendly:** Unlike other vaults, Blackhole stays unlocked when you switch tabs, so you can easily copy-paste credentials.
- **Modern UI:** Built with Tailwind CSS, Framer Motion, and a dark "void" aesthetic.
- **Responsive Design:** Optimized for both desktop and mobile use.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Cryptography:** [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- **Database:** MongoDB (via Mongoose)
- **Testing:** [Vitest](https://vitest.dev/)

## 📦 Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **MongoDB**: A running instance (local or cloud, e.g., MongoDB Atlas)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/anni-x1/Blackhole.git
    cd Blackhole
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy the example environment file to create your local configuration:
    ```bash
    cp .env.example .env
    ```

    Open `.env` and populate the required variables:
    - `DATABASE_URL`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/blackhole`).
    - `SESSION_PASSWORD`: A complex string (at least 32 characters) used to encrypt session cookies.

## 💻 Usage

### Development Server

To start the application in development mode with hot-reloading:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Production Build

To build and start the application for production:

```bash
npm run build
npm start
```

### Running Tests

This project uses **Vitest** for unit and integration testing.

```bash
# Run tests once
npx vitest run

# Run tests in watch mode
npx vitest
```

### Linting

To check for code quality and style issues:

```bash
npm run lint
```

## 🛡️ Security Architecture

1.  **Encryption Key:** When you enter your passphrase, a cryptographic key is derived using `PBKDF2` (SHA-256, 250k iterations) with a unique salt.
2.  **Encryption:** Your vault data (passwords, API keys, etc.) is serialized to JSON and encrypted using `AES-GCM` with a random 96-bit IV.
3.  **Storage:** Only the encrypted `ciphertext`, `iv`, `salt`, and `kdf` parameters are sent to the server.
4.  **Decryption:** Upon retrieval, the encrypted blob is downloaded to the client. The client re-derives the key (or uses the session-cached key) to decrypt the blob locally.
5.  **Session Security:** The session cookie is set to expire immediately upon browser closure (`ttl: 0`), ensuring no sessions persist on shared devices.

## 🤝 Contribution Guidelines

We welcome contributions! Please follow these steps to contribute to Blackhole Vault:

1.  **Fork the Repository:** Click the "Fork" button on the top right of the repository page.
2.  **Clone your Fork:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/Blackhole.git
    ```
3.  **Create a Branch:** Create a new branch for your feature or bug fix.
    ```bash
    git checkout -b feature/amazing-feature
    ```
4.  **Make Changes:** Implement your feature or fix. Ensure your code follows the project's style and conventions.
5.  **Test:** Run tests to ensure nothing is broken.
    ```bash
    npx vitest run
    ```
6.  **Commit:** Commit your changes with a clear and descriptive message.
    ```bash
    git commit -m "feat: add amazing feature"
    ```
7.  **Push:** Push your branch to your forked repository.
    ```bash
    git push origin feature/amazing-feature
    ```
8.  **Open a Pull Request:** Go to the original repository and open a Pull Request (PR) from your fork. Provide a clear description of your changes.

## 📄 License

This project is licensed under the MIT License.