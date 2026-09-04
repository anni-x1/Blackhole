# Repository Guidelines

## Project Structure & Module Organization

Blackhole Vault is a Next.js App Router application written in TypeScript. Application routes and API handlers live in `src/app/` (for example, `src/app/api/auth/` and `src/app/api/vault/`). Reusable UI is organized by domain under `src/components/ui/` and `src/components/vault/`. Put client state in `src/context/`, shared business logic in `src/lib/`, Mongoose models in `src/models/`, and shared types in `src/types/`. Unit tests sit beside the module they cover, such as `src/lib/crypto.test.ts`.

## Build, Test, and Development Commands

- `npm install` installs dependencies (Node 20 is used in CI).
- `npm run dev` starts the local Next.js server with webpack at `http://localhost:3000`.
- `npm run lint` runs the Next.js ESLint configuration.
- `npm test` runs the Vitest suite once in a jsdom environment.
- `npx vitest` runs tests in watch mode while developing.
- `npm run build` creates the production build; use `npm start` to serve it.

Before opening a PR, run `npm run lint`, `npm test`, and `npm run build`; CI runs the same checks.

## Coding Style & Naming Conventions

Use TypeScript with strict type checking and the `@/*` alias for imports from `src/`. Follow the existing code's two-space indentation, semicolons, and single quotes in configuration files; keep nearby source formatting consistent. Name React components in PascalCase (`VaultDashboard.tsx`), helpers in kebab-case (`password-audit.ts`), and tests as `<module>.test.ts`. Prefer small, typed functions and keep browser-only crypto logic out of server API handlers.

## Testing Guidelines

Write Vitest tests for changes to `src/lib/` and other behavior with clear, focused assertions. Use descriptive `describe`/`it` labels that state the expected outcome. Update or add tests whenever changing encryption, transfer, password-audit, authentication, or session behavior. No repository-wide coverage threshold is configured; meaningful coverage of changed code is expected.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style subjects, e.g. `feat: clipboard auto-clear`, `fix: ensure crypto compatibility`, and `chore: implement CI pipeline`. Keep commits imperative and scoped to one concern. Pull requests should explain the user-visible or security impact, link the relevant issue when available, list validation commands run, and include screenshots for UI changes.

## Security & Configuration

Configure local values in `.env` using `.env.example` as a reference. Never commit real database URLs, session secrets, decrypted vault data, or exports. Treat client-side encryption and session changes as security-sensitive: preserve the zero-knowledge boundary and validate both upgrade and existing-user flows.
