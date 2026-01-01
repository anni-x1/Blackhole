# Blackhole: Zero-Knowledge Password & API Key Vault

Build a secure, zero-knowledge password & API key vault frontend in Next.js (React). Deliver a complete, production-ready frontend project (responsive) with rich glassmorphism + cosmic/cute space vibes. Everything below is a non-negotiable requirement.

## GOAL
Create a client-side only, zero-knowledge vault where encryption/decryption happens only in the browser. The server is a dumb storage box (user will build later). The frontend must store one encrypted vault JSON blob on the server and only ever send/receive that blob. The UI must include separate sections: Passwords, APIs, and Playground (encrypted scratchpad). Include all features listed below plus full documentation and mock data for development.

## CRYPTOGRAPHY & KEY MANAGEMENT (must follow these specs)
• All encryption/decryption occurs in the browser using the Web Crypto API.
• Key derivation: PBKDF2 (HMAC-SHA256) with a random 16-byte salt, iterations = 250,000 (or use Argon2-wasm if available; otherwise PBKDF2 as above). Key length = 256 bits. Use UTF-8 encoding and canonical normalization on the passphrase.
• Symmetric cipher: AES-GCM, 256-bit key, 12-byte random IV for each encryption operation. Use AES-GCM’s built-in integrity.
• Vault model: single encrypted JSON object (the entire vault is encrypted and stored as one blob). Vault envelope format (store as JSON before base64 if needed):

```json
{
  "version": 1,
  "kdf": "PBKDF2",
  "iterations": 250000,
  "salt": "<base64>",
  "iv": "<base64>",            // IV used for the ciphertext
  "ciphertext": "<base64>",    // AES-GCM output
  "createdAt": "<ISO>",
  "updatedAt": "<ISO>"
}
```

• When updating the vault, generate a new IV and re-encrypt the full vault content, but reuse the same salt/iterations for the same passphrase session (it's fine to keep or rotate salt on major rekey flows — document choices).
• The plaintext vault structure (before encryption) must be:

```json
{
  "passwords": [
    {
      "id": "<uuid>",
      "service": "gmail.com",
      "username": "anni@gmail.com",
      "password": "<plaintext>",
      "remarks": "two-factor enabled",
      "custom": { "phone": "..." } // optional flexible fields
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "apis": [
    {
      "id": "<uuid>",
      "service": "openai",
      "apikey": "sk-xxxx",
      "remarks": "for testing",
      "custom": { "env": "dev" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "playground": {
    "scratch": "plaintext note (can be multiline)"
  },
  "meta": { "version": 1 }
}
```

• Never store master passphrase anywhere (not localStorage, not server). The passcode is used only to derive the key in memory then immediately freed (zeroing ArrayBuffers where possible and nulling references). Document limitations: garbage collection cannot be forced; explain recommended user hygiene.

## AUTH FLOW & STORAGE ASSUMPTIONS
• Passcode-only unlock. No account creation required. The passcode unlocks/decrypts the vault.
• Server contract: server stores a JSON object with the vault envelope (above). Frontend simply GET /api/vault to read and POST /api/vault to replace the vault blob. Provide mock API endpoints (Next.js API routes or a mocked fetch adapter) for development that return 3 dummy entries. Server should not be able to decrypt the vault (zero-knowledge).
• Frontend must support first-time vault creation: user sets new passcode → generate salt → derive key → create empty plaintext vault → encrypt → POST to server.

## UI / UX (required)
• Tech: Next.js (React). Use TypeScript. Use componentized structure and clean folder layout. Use Tailwind CSS for rapid styling, but include raw CSS fallback for core visuals.
• Visual theme: glassmorphism (frosted/blurred panels), glossy accents, subtle cosmic / space motif (stars, soft gradients, faint nebula background, small planet/particle decorations) and a cute aesthetic—rounded corners, gentle shadows. Provide a toggle for dark/light while preserving glass feel and cosmic accents.
• Responsive: mobile-first and desktop. Mobile controls and modals must be finger-friendly.
• Layout: Header (vault name + lock/unlock status), left nav or tabbed top nav with three sections: Passwords, APIs, Playground. Right side or top area: quick actions (Add Entry, Generate Password, Lock Now).
• Passwords section: list of entries showing service, username (obfuscated by default), createdAt. Each row: View (decrypt & reveal inline modal), Copy password button (copies to clipboard then clears after 15s), Edit, Delete (confirmation modal), Extra fields button (to add extra optional fields per entry). When revealing, mask by default and require a button to show. Provide search & filter by service.
• APIs section: same UX but for API keys. Fields: service name, apikey, remarks, custom fields. Copy API key behavior same as passwords.
• Add/Edit modal: inputs for service name, username/email (password section), password (or apikey), remarks (multiline) and a dynamic “Add optional field” control (key + value). Validate required fields. Option to auto-generate strong password (with length and complexity controls) or paste own. Provide a password strength meter.
• Delete: must ask confirmation. Optionally soft-delete (local trash) — but primary requirement: delete permanently from plaintext vault before re-encrypting; document tradeoffs.
• Clipboard safety: after copy, show toast + countdown and automatically clear clipboard after 15 seconds (use navigator.clipboard.writeText('') to clear where possible) and overwrite the memory variables storing the secret. Document limitations (OS/Browser may prevent clearing).
• Auto-lock: auto-lock (re-encrypt and purge key material) after inactivity (default 5 minutes) and immediately on window blur, visibilitychange to hidden, or page unload. Provide an easily accessible “Lock Now” button.
• Encrypted Playground: a scratchpad that is part of the same vault, encrypted with the same key. Allow rich text or plain text toggle. Provide clear label that it's encrypted.
• Dummy data: include 3 realistic dummy password entries and 3 API entries inside the mock vault for development. The dummy vault must be encrypted with a test passcode (document the passcode for dev).
• Accessibility: keyboard navigation, aria labels on buttons, color contrast that passes WCAG AA.

## INTERACTIONS, CLIENT LOGIC & UX DETAILS
• Master passcode entry screen: passcode input + derive key + decrypt vault. Provide helpful errors for wrong passcode (generic: “Unable to unlock vault — check passcode” — do not leak whether vault exists).
• Vault import from plaintext: provide a guided import tool where user can paste old .txt entries in a simple format; UI parses lines and shows preview; user confirms; encryption happens client side then saved to server. After import, show “Delete local plaintext” guidance and a one-click utility to try to securely overwrite local variables (document limitations).
• Export: allow user to export the encrypted vault blob (base64 JSON) and a plain encrypted backup file. Also allow plain JSON export only after explicit confirmation and a second major warning (explicitly confirm passphrase). Document that plain export is dangerous.
• Offline mode: if server unreachable, allow local edits and queue the encrypted blob to be uploaded next time (document merge strategy: use last-write wins and timestamps). Provide a visible sync indicator.

## DOCUMENTATION (must be included and very thorough)
Provide a README and a SECURITY.md with these sections (at minimum):

Project setup & run (npm/yarn commands, env variables).

Build/deploy steps for production (Next.js build, recommended hosting).

Full encryption spec (KDF, salt, iterations, IV, AES mode, vault envelope JSON example).

API contract (server endpoints the frontend expects — sample requests & responses):
• GET /api/vault → 200 { "vault": <vaultEnvelopeJSON> } or 404 if not present
• POST /api/vault → body { "vault": <vaultEnvelopeJSON> } → 200 { "ok": true, "updatedAt": "..." }
• DELETE /api/vault → delete blob (if user requests) → 200
Provide sample cURL commands for each.

Client workflows: unlock, create, add entry, edit, delete, copy, auto-lock.

Threat model + limitations (what it defends against and what it does not — e.g., if attacker controls your machine or you forget passcode).

Migration guide from plaintext .txt (script + UI flow).

Testing & QA checklist (unit tests for crypto functions, integration tests for encrypt/decrypt cycle, E2E test suggestions).

Dev notes: where to swap PBKDF2->Argon2, how to hook real server endpoints, offline sync considerations.

Accessibility checklist.

## DELIVERABLES (what the AI must produce)
• Full Next.js + TypeScript frontend repo (componentized, clean).
• A CryptoUtil module with clear, well-commented functions: deriveKey(passphrase, salt, iterations), encryptVault(key, plaintext), decryptVault(key, envelope), and safe memory clearing helpers. Use Web Crypto Subtle. Include example code snippets in docs for manual verification.
• UI components: UnlockScreen, VaultDashboard, PasswordsList, APIsList, Playground, AddEditModal, ConfirmDeleteModal, Toast/Notifications, ThemeToggle, SyncIndicator, Settings (auto-lock timeout).
• Mock API adapter (for development) and also clear instructions for switching to real server endpoints.
• 3 dummy password entries + 3 dummy API entries encrypted in a sample vault for demo (include dev passcode in README).
• Unit tests for the core crypto functions (encrypt/decrypt roundtrip) and at least component tests for Add/Edit flows.
• Full README + SECURITY.md + API docs + sample cURL.
• A small “developer playground” page that allows calling the encryption utilities directly (enter passcode → show derived key material length & PBKDF2 timing info, encrypt sample JSON, decrypt it) — for debugging only.

## IMPLEMENTATION NOTES (explicit, enforceable)
• Use strong UUIDs for entry IDs.
• Use secure random (crypto.getRandomValues) for salt & IV.
• Use subtle.stringify helpers for base64 conversions; never use insecure ad hoc base64 libs.
• When copying to clipboard, use async navigator.clipboard.writeText and then setTimeout to clear after 15s; then null and overwrite variables that held the secret. Show visual countdown.
• Auto-lock must clear all in-memory keys, set unlocked=false, and remove any plain data from React state. For memory clearing, explicitly overwrite ArrayBuffers and set variables to null. Document that garbage collector may still keep copies.
• Defensive UX: on wrong passcode attempts, exponential backoff in UI (client side) to slow brute force attempts. Log attempts locally (only counts, no plaintext).
• Use client-side caching of encrypted blob in IndexedDB for offline edits (but always encrypted). Do not cache plaintext anywhere.

## EXAMPLES & MOCK DATA
• Provide a dev passcode: dev-pass-2026 (use this only for development). Include the encrypted vault blob sample in /mock/vault.json. The vault contains 3 password entries and 3 API entries (realistic but non-sensitive).

## ACCEPTANCE CRITERIA (how to verify)

Using the dev passcode, unlock the UI and see dummy entries.

Add a new password entry → it appears encrypted on server (server shows only the vault blob).

Copy the password to clipboard → clipboard cleared after 15s.

Edit and delete entries work and changes persist after reloading and unlocking again.

Playground saves and loads encrypted content.

Auto-lock triggers on timeout and when switching tabs.

README + API docs exist and show the exact vault envelope format and sample cURL commands.

## UX POLISH & NICE-TO-HAVE (not required but include if trivial)
• Password generator presets (12/16/24 length, include symbols).
• Small micro-animations for glass panels (no heavy JS animation).
• Tiny star/particle background with low CPU use.
• Option to show “vault health” (how many items use same password).

## FINAL NOTE FOR THE AI CODER
This project’s security depends on correct crypto and exact handling. If a library is used to polyfill Argon2 or AES, list the library and justify trust. Include inline comments in crypto code explaining every step and why it’s safe or what to watch for. The server is intentionally dumb — do not put secret material there.
