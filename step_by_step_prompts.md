# Step-by-Step Implementation Prompts

Purpose: Sequential AI engineering prompts to implement the Core Gameplay & Narrative Platform per `docs/core-gameplay-prd.md` and `docs/core-gameplay-techspec.md`. Each prompt states: Objective, Inputs/Context to provide, Deliverables, Constraints (No external network calls if offline), Acceptance Criteria Mapping, and Required Tests to generate. Do NOT include real secrets. Avoid placeholder code smell; produce production-quality modular implementation.

> Usage: Execute prompts in order. After each prompt output, run the generated tests and linting before proceeding.

## Index

1. Environment & Tooling Setup
2. Domain Schema & Types
3. Persistence Layer & IndexedDB Abstraction
4. State Management Slices Scaffolding
5. Content Schema Validation & Loader
6. Mission System Core (Acceptance/Abandon/Filtering)
7. Hacking Session Engine (Tick Loop & Tool Runs)
8. Trace & Noise / Adaptive Defense Mechanics
9. Log System & Scrub Mechanic
10. Narrative Branching Engine & Flags
11. Faction & Reputation System
12. Hardware & Tool Upgrade System
13. Economy & Pricing / Ledger
14. Security Defense Archetypes & Random Ordering
15. UI Foundation (Routing, Theming, Docking Layout)
16. Mission Board & Filtering UI
17. Hacking Session UI (Defenses, Tools, Trace Meter)
18. Log Scrub & Post-Mission Resolution UI
19. Narrative Choices & Branch Map UI
20. Faction Panel & Reputation Effects UI
21. Upgrades / Market UI
22. Autosave & Manual Save Slots
23. Performance Instrumentation & Optimization Pass
24. Test Harness & Deterministic Simulation Tests
25. Balance Simulation & Economy Tuning
26. Accessibility & Keyboard Navigation Basics
27. Final QA Coverage & AC Audit
28. Packaging & Release Checklist

---

## 1. Environment & Tooling Setup

Objective: Establish project scaffolding ensuring reproducibility, type safety, linting, formatting, and test harness.
Context to Provide: Tech spec sections 3,5,15; Node version target; preferred package manager.
Deliverables:

- `package.json` with scripts: build, dev, test, lint, typecheck, format, validate:content
- ESLint + Prettier config
- TypeScript config (strict mode, path aliases for domain modules)
- Jest / Vitest (preferred for speed) config with jsdom + seedable RNG mock utilities
- Basic directory structure (`src/domain`, `src/store`, `src/persistence`, `src/ui`, `content/`)
  Constraints: No unused dependencies; keep dev dependencies minimal.
  Acceptance Criteria Mapping: Enables all subsequent implementation tasks; foundation for performance instrumentation (US-TECH-1 prep).
  Tests to Generate: Lint run passes, sample type test, trivial unit test verifying seeded RNG reproducibility.

## 2. Domain Schema & Types

Objective: Implement TypeScript interfaces/types for all entities described in spec Section 4.
Context: Tech spec Section 4; PRD user stories for field relevance.
Deliverables: `src/domain/types.ts` with entities, enums (difficulty bands, defense archetypes), branded ID types, utility guard functions.
Constraints: No logic—types only; ensure future compatibility via version fields where needed.
Acceptance Mapping: Supports every AC referencing domain fields.
Tests: Type-level (compile) + small runtime guard tests validating discriminated unions.

## 3. Persistence Layer & IndexedDB Abstraction

Objective: Create abstraction handling schema versioning, atomic writes, backups, checksum validation.
Context: Tech spec Section 6.
Deliverables: `src/persistence/db.ts`, `src/persistence/migrations/` with initial migration, checksum utility, atomic commit function, corruption recovery logic.
Constraints: Promise-based API; no direct UI code; instrumentation hooks.
Acceptance Mapping: US-PROF-1 (persistence), US-PERS-1/2 (autosave/version-safe), risk mitigation (save corruption).
Tests: Simulate write/read cycle, corrupt blob test (forces backup), version bump migration path.

## 4. State Management Slices Scaffolding

Objective: Create Redux Toolkit slices matching Section 5.
Context: Tech spec Sections 4 & 5.
Deliverables: Slice files with initial state, reducers, minimal actions (set active profile, hydrate content, etc.). Root store config with middleware placeholder.
Constraints: No heavy logic; pure + serializable checks enabled.
Acceptance Mapping: Prereq for all interactive ACs.
Tests: Reducer immutability tests, initial state shape snapshot.

## 5. Content Schema Validation & Loader

Objective: JSON Schema definitions + validation pipeline for missions, narrative nodes, economy config.
Context: Tech spec Sections 7,9,10.
Deliverables: `content/schema/*.json`, `src/content/loader.ts` performing validation + hash + caching.
Constraints: Validation errors collected & reported; invalid items skipped gracefully.
Acceptance Mapping: US-TECH-2 AC1, US-MISS series, narrative support.
Tests: Invalid mission (missing objective) rejected; valid mission loads; hash stable.

## 6. Mission System Core (Acceptance/Abandon/Filtering)

Objective: Implement mission gating, acceptance flow, abandonment rules, availability reasoning.
Context: Tech spec Section 7.
Deliverables: `src/domain/mission/missionManager.ts` with pure functions; thunks wiring to store.
Constraints: Deterministic ordering for tests; returns structured lock reasons.
Acceptance Mapping: US-PROF-3 AC1/2/3, US-MISS-1 AC1/2/3, US-MISS-4.
Tests: Gating scenarios (tool tier missing, reputation insufficient), abandon timing logic.

## 7. Hacking Session Engine (Tick Loop & Tool Runs)

Objective: Core simulation: tool concurrency, runtime calc, defense progress updates.
Context: Tech spec Section 8.
Deliverables: `src/domain/hacking/engine.ts` with start/cancel/update APIs, seed-based RNG.
Constraints: Tick interval injectable for tests; no direct DOM usage.
Acceptance Mapping: US-HACK-2 AC1-4.
Tests: Concurrency limit enforced; cancel frees slot < expected threshold; progress interpolation.

## 8. Trace & Noise / Adaptive Defense Mechanics

Objective: Implement trace accumulation, noise spikes, adaptive defense tier increase.
Context: Sections 8 & 12.
Deliverables: `src/domain/hacking/trace.ts`, `src/domain/hacking/adaptive.ts`.
Constraints: Side-effect free except state mutation via passed context object.
Acceptance Mapping: US-HACK-3 AC1-3, US-SEC-2 AC1-3.
Tests: Noise spike decay timing, adaptive +1 only once, full trace triggers failure event.

## 9. Log System & Scrub Mechanic

Objective: Logging of tool operations and scrubbing process with partial outcomes.
Context: Section 8.
Deliverables: `src/domain/hacking/logs.ts` functions; scrub algorithm.
Constraints: Deterministic time cost formula; partial scrub classification.
Acceptance Mapping: US-HACK-4 AC1-4.
Tests: Three log categories present; scrub time scales with size; success flag reduces detection probability state.

## 10. Narrative Branching Engine & Flags

Objective: Flag evaluation, branch nodes, irreversible choices, endings tracking.
Context: Section 9.
Deliverables: `src/domain/narrative/branching.ts`.
Constraints: Simple AND/OR expression evaluator; no deep recursion.
Acceptance Mapping: US-STORY-1/2/3.
Tests: Branch availability evaluation; ending recorded; irreversible choice enforcement.

## 11. Faction & Reputation System

Objective: Reputation adjustments, decay, exclusive mission locking, hostile counter trigger.
Context: Sections 10 & 9 interplay.
Deliverables: `src/domain/factions/reputation.ts`.
Constraints: Decay tick abstracted; thresholds mapping stable.
Acceptance Mapping: US-FACT-1 AC1-4, US-FACT-2 AC1-3.
Tests: Threshold label transitions; exclusive mission lock; decay after inactivity.

## 12. Hardware & Tool Upgrade System

Objective: Hardware purchase, tool version ownership & runtime impact calc.
Context: Section 11.
Deliverables: `src/domain/upgrades/hardware.ts`, `src/domain/upgrades/tools.ts`.
Constraints: Irreversible hardware purchase; ensure >=10% improvement check.
Acceptance Mapping: US-UPG-1, US-UPG-2, US-UPG-3.
Tests: Concurrency increase after upgrade; runtime improvement >=10%; invalid tool run blocked with clear error.

## 13. Economy & Pricing / Ledger

Objective: Payout scaling, cost curves, transaction ledger with 20-entry cap.
Context: Sections 11 & 7 (payout from missions).
Deliverables: `src/domain/economy/economy.ts` & ledger module.
Constraints: Pure pricing functions; ledger prune oldest.
Acceptance Mapping: US-ECON-1 AC1-3, US-ECON-2 AC1-3.
Tests: Difficulty multiplier application; upgrade affordability progression simulation; ledger cap & negative styling flag.

## 14. Security Defense Archetypes & Random Ordering

Objective: Archetype configuration & constrained shuffle algorithm.
Context: Section 12.
Deliverables: `src/domain/hacking/defenses.ts`.
Constraints: No >2 high-noise adjacent; retry shuffle or post-process swap.
Acceptance Mapping: US-SEC-1 AC1-3.
Tests: Five archetypes present; ordering constraint always satisfied across many seeds.

## 15. UI Foundation (Routing, Theming, Docking Layout)

Objective: SPA scaffolding, pane system, theme toggle, persisted layout.
Context: Sections 3,13.
Deliverables: `src/ui/App.tsx`, docking layout components, theme provider.
Constraints: Persist layout debounced; no blocking loads.
Acceptance Mapping: US-UI-1 AC1-3, US-UI-2 AC1.
Tests: Layout persistence; theme toggle state; pane docking reorder.

## 16. Mission Board & Filtering UI

Objective: Display missions w/ filters & lock reasons.
Context: Sections 7,13.
Deliverables: `src/ui/mission/MissionBoard.tsx`.
Constraints: Filtering client-side; virtualization optional.
Acceptance Mapping: US-MISS-1 AC1-3, US-PROF-3 AC2.
Tests: Filter combinations; locked mission hint rendering.

## 17. Hacking Session UI (Defenses, Tools, Trace Meter)

Objective: Visualize defenses, progress, concurrency, trace meter.
Context: Sections 8,12.
Deliverables: `src/ui/session/SessionView.tsx`.
Constraints: Progress bar throttle 100ms; accessible labels.
Acceptance Mapping: US-HACK-1 AC1-3, US-HACK-2 AC1-4, US-HACK-3 AC1-3.
Tests: Trace meter ETA update rate; cancel tool frees slot; scan reveals unknowns.

## 18. Log Scrub & Post-Mission Resolution UI

Objective: Log list categories, scrub action UI, mission result summary.
Context: Section 8.
Deliverables: `src/ui/session/LogsPanel.tsx`, `ResultModal.tsx`.
Constraints: Non-blocking scrub animation; partial vs full indicators.
Acceptance Mapping: US-HACK-4 AC1-4.
Tests: Three categories displayed; scrub time effect; probability flag after success.

## 19. Narrative Choices & Branch Map UI

Objective: Diegetic message choice UI, branch map silhouettes, endings codenames.
Context: Section 9.
Deliverables: `src/ui/narrative/ChoicePane.tsx`, `BranchMap.tsx`.
Constraints: Irreversible selection confirmation step (non-browser modal); silhouettes hide titles.
Acceptance Mapping: US-STORY-2 AC1-3, US-STORY-3 AC1-3.
Tests: Choice hint display; branch map locked silhouettes; ending codename listing.

## 20. Faction Panel & Reputation Effects UI

Objective: Display reputations, labels, discounts, decay warnings.
Context: Sections 10 & 11.
Deliverables: `src/ui/factions/FactionPanel.tsx`.
Constraints: Color-coded tiers; reactive unlock indicators.
Acceptance Mapping: US-FACT-1 AC1-4, US-FACT-2 AC1-3.
Tests: Tier label transitions; exclusive mission lock indicator; decay warning after inactivity.

## 21. Upgrades / Market UI

Objective: Display hardware tiers & tool versions with gating & pricing.
Context: Sections 11,10.
Deliverables: `src/ui/market/MarketView.tsx`.
Constraints: Inline error on insufficient hardware; highlight >=10% improvement tooltip.
Acceptance Mapping: US-UPG-1/2/3.
Tests: Purchase flow updates concurrency; version replacement; error on mismatch hardware.

## 22. Autosave & Manual Save Slots

Objective: Implement autosave trigger orchestration & manual slots UI.
Context: Sections 6,14.
Deliverables: Autosave middleware, `src/ui/saves/SaveManager.tsx`.
Constraints: Debounce 750ms; background commit indicator.
Acceptance Mapping: US-PERS-1 AC1-3, US-PERS-2 AC1-3.
Tests: Autosave triggers on events; manual slot creation; corruption rollback scenario.

## 23. Performance Instrumentation & Optimization Pass

Objective: Add tick profiling, memory snapshots, lazy loading boundaries.
Context: Section 15.
Deliverables: Instrumentation utilities; dashboard pane (dev mode only).
Constraints: No production perf cost > minimal overhead (feature flag gating).
Acceptance Mapping: US-TECH-1 AC1-3.
Tests: Profiling metrics captured; load time budget validated via mocked timers.

## 24. Test Harness & Deterministic Simulation Tests

Objective: Robust deterministic tests for hacking engine & branching logic.
Context: Sections 8,9,16.
Deliverables: Seed utility, snapshot specs, failure path tests.
Constraints: Seeds stable per mission ID.
Acceptance Mapping: Broad coverage; ensures reliability for adaptive & trace systems.
Tests: Already inherent. Expand with multi-seed variance tests.

## 25. Balance Simulation & Economy Tuning

Objective: Script prompts to iterate economy parameters to meet upgrade pacing targets.
Context: Sections 11,15.
Deliverables: Balance simulation tool spec; iterative prompt guiding adjustments.
Constraints: No random uncontrolled factors; seed all simulations.
Acceptance Mapping: US-ECON-1 AC1-2, US-UPG-3 AC1.
Tests: Simulation outputs showing mission counts to afford next upgrade within target bands.

## 26. Accessibility & Keyboard Navigation Basics

Objective: Implement focus cycle, ARIA labels, skip-to-pane command.
Context: Section 13.
Deliverables: Accessibility helpers; navigation map.
Constraints: Keep scope to basics (non-goal: full WCAG compliance).
Acceptance Mapping: Implicit baseline from PRD constraints.
Tests: Focus traversal order; ARIA role presence.

## 27. Final QA Coverage & AC Audit

Objective: Systematic verification each PRD AC has implementation & test evidence.
Context: All previous.
Deliverables: Generated checklist mapping AC → file(s) & test(s).
Constraints: Automated cross-reference script spec.
Acceptance Mapping: Completes overall deliverable quality.
Tests: Script outputs zero missing ACs.

## 28. Packaging & Release Checklist

Objective: Prepare production build, verify integrity, artifact documentation.
Context: Sections 3,15.
Deliverables: Deployment instructions (static hosting), integrity checklist (hashes), README additions.
Constraints: Offline-first asset strategy; service worker optional future.
Acceptance Mapping: Enables shipping; performance targets reaffirmed.
Tests: Build size budget check; smoke E2E run on built artifacts.
