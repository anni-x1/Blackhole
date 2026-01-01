# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please do NOT open an issue. Email `security@example.com` instead.

## Security Architecture

*   **Client-Side Only**: We do not store keys on the server.
*   **Memory Hygiene**: Keys are stored in closures/refs and explicitly nulled on lock. We rely on the JS engine's Garbage Collector, which is a known limitation.
*   **XSS**: This application is vulnerable to XSS. If an attacker can inject script, they can steal the unlocked vault. Ensure your deployment headers (CSP) are strict.
