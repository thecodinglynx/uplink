# Uplink Platform

Modular gameplay & narrative simulation framework featuring deterministic procedural generation, adaptive defenses, faction reputation, an economy layer, instrumentation, and an extensible UI shell.

## Feature Overview

- Deterministic RNG & Multi-Seed Validation – Reproducible defense layouts and session ordering (`seededRng`, determinism tests).
- Defense Generation & Constraints – Archetype templates with high-noise adjacency rule enforcement.
- Hacking Session Engine – Tool run queue, trace progression, adaptive defense reactions.
- Log Scrubbing & Narrative Branching – Redaction logic plus branch selection utilities.
- Factions & Reputation – Exclusive ALLIED faction state, decay, thresholds.
- Upgrades System – Hardware tiers influencing concurrency & tool version speed modifiers.
- Economy & Ledger – Earn/spend ledger, faction discount resolution.
- Autosave Middleware – Debounced store persistence with instrumentation of write durations.
- Performance Instrumentation – Tick and persistence metrics via global singleton collector.
- Balance Simulation Harness – Batch run seeds to gather defense tier frequencies, payout distribution, trace failure heuristic.
- Accessibility Foundations – Landmark/region semantics applied to early pane scaffolding.

## Scripts

| Script                | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `dev`                 | Launch Vite dev server (UI scaffolding)     |
| `build`               | Type check & bundle                         |
| `typecheck`           | TS diagnostics only                         |
| `lint`                | ESLint pass                                 |
| `format`              | Prettier write formatting                   |
| `test` / `test:watch` | Vitest suite (85 tests)                     |
| `validate`            | Aggregate validation pipeline (lint + test) |

## Quick Start

```bash
npm install
npm run test
npm run dev
```

Navigate to the dev server (default: http://localhost:5173) to view placeholder panes.

## Simulation Harness Usage

Programmatic example (Node / TS):

```ts
import { runBalanceSimulation } from './src/simulation/balanceRunner';
import { DefenseArchetype } from './src/domain/types';

const template = [
  { archetype: DefenseArchetype.FIREWALL, minTier: 1, maxTier: 2 },
  { archetype: DefenseArchetype.ICE_SENTINEL, minTier: 1, maxTier: 3, highNoise: true },
];

const metrics = runBalanceSimulation({ seeds: [1, 2, 3, 4, 5], template, payoutScale: 120 });
console.log(metrics);
```

Returned metrics include:

```
{
	totalRuns,
	avgDefenseCount,
	highNoiseAdjacencyViolations,
	tierFrequency: { tier -> count },
	seedSignatures: { seed -> archetype:tier|... },
	avgPayout, medianPayout, stdDevPayout,
	traceFailureRate
}
```

## Architecture Notes

- Domain modules are pure & side-effect light; persistence, UI, and instrumentation remain layered on top.
- A single global instrumentation collector avoids duplicate module state under differing import paths.
- Tests include both `.ts` and generated `.js` mirrors to ensure consumption parity.

## Accessibility

Pane components define `<section>` landmarks with `aria-labelledby` and headings to seed future screen reader flows. Further work: keyboard focus order, ARIA live regions for session events.

## Testing Strategy

See `docs/qa-coverage.md` for mapping of feature areas to test files. Determinism tests function as regression guardrails for procedural systems.

## Roadmap (Excerpt / Future)

- Rich mission board interactions & filtering.
- Expanded economy balancing using real mission payouts.
- Advanced profiling & performance budgets.
- UI theming & dark mode tokens.
- Additional accessibility audits (axe, snapshot diffs).

## Path Alias Removal (2025-09)

The codebase previously used TS/Vite path aliases (e.g. `@domain/*`, `@store/*`) for module resolution. On a Windows environment the Vite dev server repeatedly failed to resolve nested alias imports despite multiple configuration strategies (object + array alias syntax, regex patterns, `tsconfigPaths` plugin, absolute + normalized paths). Rather than continue to spend time on build tooling variance, all runtime (non-test) imports were migrated to stable relative paths.

Outcome:

- All application source files now use relative imports.
- (Completed) Test files have been migrated off `@domain/*` imports; aliases now removed from `tsconfig.json`.
- Duplicate legacy blocks created during transition (notably in `upgradeManager`, `balanceRunner`, `payout` middleware) were cleaned.
- Full test suite passes post-migration.

Rationale / Benefits:

- Removes a Windows-specific dev server blocker immediately.
- Eliminates an extra cognitive + config layer while the project structure stabilizes.
- Keeps option open to reintroduce aliases later once UI stabilizes (with a smaller surface area to debug).

Follow‑Up (Optional):

1. (Done) Convert all test imports away from `@domain/*` → relative paths.
2. (Done) Remove alias entries from `tsconfig.json` & any residual Vite config if no longer required.
3. Introduce a single `src/paths.ts` barrel only if ergonomics become an issue (avoid premature abstraction).

## Upcoming Milestones

Short term (engineering hygiene):

1. Test Import Normalization – Remove remaining alias usage in tests; prune `paths` map.
2. Vite Config Simplification – Drop unused alias config blocks; document minimal build settings.
3. Deterministic Seed Replay CLI – Small script to reproduce a session (`--seed`, `--mission` flags) for faster debugging.
4. Payout Curve Refinement – Tie payout multiplier more directly to defense noise density + tier variance.
5. Reputation Event Log – Surface recent reputation adjustments with reasons in UI panel.

Medium term (feature depth): 6. Mission Board UX – Filtering, sorting, acceptance cooldown indicators. 7. Adaptive Defense Telemetry – Visualize when adaptive modifiers trigger & their impact. 8. Tool Version Progression Balancing – Data-driven curve (capture distribution metrics across simulated profiles). 9. Narrative Branch Visualization – Graph overlay / dev-only explorer. 10. Save Slot Management UI – Multi-slot load/save with timestamp & summary stats.

Longer term (stretch): 11. Procedural Mission Generator v2 – Weighted objectives, dynamic defense archetype mixes. 12. Remote Persistence Option – Abstract storage layer for cloud sync (feature‑flagged). 13. Accessibility Benchmarking – Automated CI axe checks & snapshot diff gating. 14. Performance Budget Alerts – Threshold-based warnings for tick / persistence latency. 15. Modding Hooks – Safe extension points for external mission packs & factions.

Each milestone intended to remain < ~500 LOC per PR to preserve review velocity and determinism guarantees.

## Node Version

Requires Node >= 18.18.0 (LTS alignment & native fetch).

## Contributing

1. Fork / branch.
2. `npm install`.
3. Make changes with focused commits.
4. `npm run lint && npm test`.
5. Open PR with context & rationale.

## License

TBD (add appropriate license file if distributing publicly).
