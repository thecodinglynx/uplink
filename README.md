# Uplink Platform

Early scaffolding for the core gameplay & narrative platform. This initial commit establishes:

- TypeScript strict config with path aliases (`@domain`, `@store`, `@persistence`, `@ui`).
- ESLint + Prettier baseline.
- Vitest configured with jsdom environment.
- Deterministic seedable RNG utility for simulation tests.
- Basic directory structure for upcoming feature implementation.

## Scripts

- `dev` – Vite development server (future UI work).
- `build` – Type check then bundle for production.
- `typecheck` – Run TypeScript without emit.
- `lint` – ESLint across TS/TSX.
- `format` – Prettier write.
- `test` / `test:watch` – Vitest run.
- `validate:content` – Placeholder (will implement in Step 5).
- `validate` – Run full local validation pipeline.

## Node Version

Requires Node >= 18.18.0 (aligns with current LTS features & fetch API stability).

## Next Steps

Proceed with Domain Schema & Types (Step 2 in the implementation plan).
