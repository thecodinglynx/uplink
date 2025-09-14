# Core Gameplay & Narrative Platform Technical Specification

Version: 0.1 (Draft)  
Source PRD: `core-gameplay-prd.md`  
Status: Draft for engineering review  
Scope: Entire v1 feature set (single‑player offline narrative hacking simulation)

## 1. Purpose & Audience

This document translates the functional PRD into an implementable, end‑to‑end design. It is exhaustive enough for an LLM or engineer to implement without referencing the PRD. No source code is included. All acceptance criteria (AC) from PRD are mapped to systems, data, and test strategies.

## 2. Guiding Principles

- Data‑Driven Extensibility: Missions, defenses, tools, economy values externalized. Minimal code changes for new content.
- Deterministic Simulation Core: Seedable tick loop for reproducible tests.
- Offline-First: No network dependency; persistence via IndexedDB.
- Separation of Simulation vs Presentation: Core logic pure & testable; UI subscribes to derived state.
- Performance-Conscious: Bounded memory, incremental hydration, lazy load heavy datasets.

## 3. High-Level Architecture

Layers (top to bottom):

1. UI Presentation Layer (React SPA + Docking/Layout System)
2. View Model / Selector Layer (memoized projections from store)
3. Application State Management (Redux Toolkit slices or equivalent lightweight store)
4. Domain Simulation Engines:
   - Hacking Session Engine
   - Narrative Branch Engine
   - Mission Lifecycle Manager
   - Reputation & Faction Manager
   - Economy & Pricing Calculator
   - Autosave Orchestrator
5. Persistence & Migration Layer (IndexedDB abstraction + schema versioning)
6. Content & Configuration Layer (external JSON/YAML validated at load)
7. Utility / Core Services (RNG seeding, time/tick scheduler, validation, logging)

Data Flow:

- Content Loader parses config → dispatches content hydration actions.
- User initiates mission → Mission Manager instantiates session state → Hacking Engine tick loop updates progress/trace/logs → Emits events → Store updated → UI re-renders.
- Narrative choices set flags → Branch Engine recalculates availability → Faction Manager updates reputations and unlocks.
- Autosave listens to domain events (mission complete, purchase, narrative choice) → Debounced async write to IndexedDB with atomic commit & backup.

Concurrency & Timing:

- Single JS thread. Tick scheduler (e.g., `requestAnimationFrame` or fixed 250ms logical tick) updates hacking operations.
- Long-running IO: IndexedDB operations; always asynchronous; UI shows non-blocking spinners for initial load only.

Assumptions (explicit):

- Technology: React 18+, TypeScript (implied), Redux Toolkit for predictable state (could be replaced; design neutral).
- Styling: CSS variables / theme tokens + possible utility framework (not mandated here).
- YAML permitted but normalized to JSON internally.
- Maximum simultaneous missions: 1 active hacking session.
- Deterministic seed assigned per mission acceptance for reproducibility.

## 4. Domain Model Overview

Primary Entities (identifier key in parentheses):

- Profile (`profileId`): username, passwordHash, credits, hardwareTierId, ownedToolVersions, narrativeFlags[], factionReputations, endingsUnlocked[], layoutPreferences, stats (missionsCompleted, completionPercent).
- HardwareTier (`hardwareTierId`): concurrencySlots, memoryCapacity, traceResistance, cost, visualKey.
- Tool (`toolId` + `version`): category, minHardwareTier, baseOperationTimeModifiers, noiseFactor, successTierOffset, cost, description.
- Mission (`missionId`): metadata (title, type, factionTags[], difficultyBand, basePayoutRange), objectives[], bonusConditions[], defenseProfileTemplate, reputationEffects[], timeConstraints, abandonmentPolicy, seedStrategy.
- Objective (`objectiveId` within mission): type (exfiltrate/modify/plant/scan/etc.), targetCount, progressState, partialCreditRules.
- BonusCondition (`bonusId` within mission): conditionType, thresholds, bonusPayout, description.
- DefenseLayer (`defenseId` within session instance): archetype, tier, adaptiveApplied(bool), currentProgress, status(pending/active/bypassed/failed), noiseEvents[].
- HackingSession (`sessionId`): missionId, activeDefenses[], activeToolRuns[], traceState, logEntries[], startTimestamp, seed, status.
- ToolRun (`runId`): toolRef, targetDefenseId, startTime, eta, progress, canceledFlag.
- TraceState: currentTraceValue (0–max), baseRate, dynamicRateModifiers[], estimatedTimeToTrace.
- LogEntry (`logId`): category(authentication, intrusion, scrub), timestamp, size, scrubStatus(present/scrubbing/removed/partial).
- NarrativeNode (`nodeId`): act, branchPointFlagSet[], prerequisites(flag expressions), resultingFlags[], isEnding(bool), codename(optional for endings).
- Faction (`factionId`): name, description, reputationValue(-100..+100), thresholds mapping to labels, discountRules, unlockMissions[].
- ReputationChange: factionId, delta, reason, timestamp.
- EconomyConfig (singleton): difficultyMultipliers, pricingCurves, upgradeCostScaling, payoutBalancing, toolVersionPerformanceIncrement (>=10%).
- Transaction (`txnId`): profileId, amount(+/-), type(earning/spend), reason, timestamp.
- SaveSlot (`slotId`): profile snapshot metadata (schemaVersion, updatedAt, summary stats) + serialized state reference.
- ScanResult: revealedDefenseCategories(levels or unknown flags) with timestamp.

Field-Level Constraints (selected):

- PasswordHash: Argon2id or bcrypt hashed locally (library selection TBD; if unavailable, PBKDF2 fallback). Stored with salt & parameters.
- Reputation range normalized to integer steps (e.g., -100, +100). Label mapping table static.
- Narrative flags are simple strings; expressions support boolean AND/OR (no nesting beyond 2 levels for v1 simplicity).
- Timestamps stored as epoch ms UTC.

## 5. State Management Strategy

Slices (indicative):

- `profiles`: activeProfileId, entities, auth status.
- `missions`: catalog(meta only), availability filters, activeMissionId.
- `missionInstances`: per accepted mission instance (mainly current active one), session derived statuses.
- `tools`: catalog of tool definitions & owned versions.
- `hardware`: hardware tiers + current owned tier.
- `factions`: reputations, thresholds, pendingDecayTimers.
- `narrative`: nodes, flags, endingsUnlocked, explorationMap.
- `economy`: config + derived price calculators.
- `ui`: layout state, theme mode, pane arrangement, activity indicators.
- `saves`: slot metadata, autosave state, migration statuses.

Derived Selectors Examples:

- Next unlockable missions (filter by narrative flags, reputation thresholds, difficulty gating).
- Difficulty band classification for active mission.
- Effective tool runtime (base _ hardware concurrency factor _ version performance boost).
- Trace ETA = (maxTrace - currentTrace) / currentRate (guard divide by zero).
- Completion percent = missionsCompleted / totalAvailable (branch-sensitive).

Event Bus (logical): Domain events originate from thunks or engine loops (e.g., `MISSION_COMPLETED`, `TOOL_RUN_PROGRESS`, `TRACE_UPDATED`). Observers (autosave, analytics placeholder) subscribe within middleware.

## 6. Persistence & Migration

Storage: IndexedDB database `uplinkGame`.
Object Stores:

- `profiles` (key: profileId) – credentials & summary fields.
- `profileState` (key: profileId) – large blob for domain slices except credentials.
- `saves` (compound key: profileId+slotId) – manual save snapshots.
- `contentCache` – parsed mission & narrative content with hash/version.
- `economyConfig` – current balancing values & hash.
- `migrations` – applied migration ids.

Schema Versioning:

- `schemaVersion` integer embedded in each blob; migration runner checks and applies ordered transforms.
- Incompatible future version: show warning; attempt best-effort downgrade blocked unless explicit rules exist.

Atomic Write:

- Write to temp store or use double-write pattern: write blob with suffix, then update pointer field inside `profiles` referencing latest commit id.
- Maintain a rolling backup (previous commit). On load, if corruption (JSON parse failure or checksum mismatch), revert to backup.

Autosave Strategy:

- Trigger queue collects events; debounce window 750ms; flush if idle or on navigation to main console.
- Background `requestIdleCallback` where supported else low-priority setTimeout.

Corruption Detection:

- Each blob includes: checksum (SHA-256 of serialized payload) + length. Validate both at read.

## 7. Mission System Design

Mission Definition (JSON) Fields:

- `id`, `title`, `type`, `factions` (array), `difficultyBand` (enum: EASY/MID/HARD+), `basePayoutRange` (min,max), `objectives` (array), `bonusConditions` (array optional), `defenseTemplate` (archetype slots with tier ranges), `reputationEffects` (array of {factionId, delta, onSuccess|onFailure}), `gates` (flag/reputation/tool/hardware requirements), `abandonment` (returnsToPool|expires, penalty?), `timeConstraints`, `seedMode` (e.g., FIXED|RANDOM|HASH(title)).

Filtering Logic:

- Evaluate gating requirements; locked missions return reasons used for UI requirement hint (AC).
- Accepting sets `activeMissionId` and instance record with seeded randomized defenses (respecting template tier bands & random ordering constraints).
- Abandon: confirmation required; apply penalty if defined; mission returns or expires (if `expires` variant sets cooldownTimestamp).

Bonus Conditions:

- Evaluated only after base objectives success; track individually; compute payout augmentation.

Partial Credit:

- Objectives optional specify `partialBuckets` mapping completion thresholds to partial payout fraction.

Validation Pipeline:

- Schema validation via JSON Schema at load time; failing missions excluded with logged error & QA flag.

## 8. Hacking Session Simulation Engine

Tick Model:

- Logical tick every 250ms for progress updates & trace accumulation; fine-grained progress interpolation computed for UI via last tick + current time.

Defense Resolution:

- Each defense archetype defines required tool category & minimum tier. If tool version tier >= defense tier → success over runtime. Else failure or extended time multiplier (design choice: fail fast). For v1: require >= tier (strict), else immediate failure.

Tool Run Lifecycle:

1. Initiate: Check concurrency (active runs < hardware.concurrencySlots). Else queue or reject.
2. Start: Compute runtime = baseTime _ (1 - versionBoost) _ (hardware modifiers) \* (difficulty scaling).
3. Tick: Increment progress; emit progress event. If canceled: mark canceled, release slot.
4. Complete: Mark defense bypassed; generate log entry; apply noise burst if tool has noiseFactor > threshold.

Trace System:

- Base rate from mission difficulty + defense noise events + active high-noise tools.
- Rate modifiers recalc each tick. Trace value increases: `trace += (baseRate + sum(modifiers)) * deltaTime`.
- On full trace: mission fail event, apply penalties, lock tool runs.

Noise Spikes:

- Defense types may trigger spike: add transient modifier lasting N ticks (decay linear).

Log Scrubbing:

- Player initiates scrub action: compute time cost = Σ(size \* baseScrubUnit / toolEfficiency) constrained by remaining trace window.
- Partial scrub scenario: If trace reaches threshold before completion, some entries remain flagged partial (increases detection probability outside this PRD scope; simply counts as unsatisfactory for bonus conditions if any).
- Success reduces future detection penalty probability (<10% as AC) by setting a state flag used in mission resolution.

Adaptive Countermeasures:

- Record consecutive failures per defense; on first failure apply +1 effective tier (once). UI event emitted.
- Resets upon mission end (success/failure/abandon/disconnect).

## 9. Narrative Branching Engine

Flag Model:

- Flags = strings set on major choices or mission outcomes.
- Expressions: arrays representing ( (A AND B) OR C ) style simplistic forms: `[ { all:["A","B"] }, { any:["C"] } ]` meaning OR across objects, AND within arrays.

Branch Nodes:

- Each node lists prerequisites (expression). When satisfied & not visited, becomes available.
- Branch Points: Nodes with multiple choice options; each option sets resultingFlags[] and may modify reputations.
- Irreversibility: On choose, mark node resolved; undo only by loading previous save slot.

Endings:

- Nodes flagged `isEnding`; when reached, append codename to endingsUnlocked.
- Branch Summary View: Build graph from visited nodes; unvisited prerequisites collapsed as silhouette nodes (no titles).

## 10. Factions & Reputation Logic

Reputation Scale:

- Integer -100..+100.
  Threshold Labels (example mapping):
- ≤ -50: Hostile
- -49..0: Neutral
- 1..50: Trusted
- > 50: Allied

Adjustments:

- Mission completion: apply success deltas; failure or abandonment apply failure deltas if defined.
- Exclusive Missions: Accepting one faction-exclusive mission sets a temporary lock flag preventing counterpart mission spawn for that cycle (cycle = refresh window or until mission completion outcome event).
- Decay: For each in-game day (defined as set of ticks or mission completions) of inactivity with a faction (no change), reduce absolute reputation toward 0 by configurable step (EconomyConfig field) until within neutral band or activity resumes.

Unlocks:

- Evaluate on reputation change event; push unlock events for tool discounts or mission availability.

Hostile Triggers:

- If reputation ≤ Hostile threshold and narrative stage past Act 2: queue counter-mission scenario injection at next board refresh.

## 11. Upgrades & Economy

Hardware Progression:

- Each tier strictly better; irreversible purchase (state retains prior tier id for analytics but no rollback UI).
- ConcurrencySlots increments steer simulation parallelism.

Tool Version Impact:

- Performance improvement formula: `effectiveTime = baseTime / (1 + versionBoost * versionLevel)` ensuring ≥10% improvement per version (versionBoost tuned; minimal guarantee logic clamps if needed).

Pricing Curve:

- Early Game: Major upgrade affordability after ~2 missions (avg payout \* 2 >= cost).
- Late Game: 4–5 missions to afford top-tier upgrades. Achieved by exponential or stepped cost scaling factors in EconomyConfig.

Externalized Config Keys:

- `difficultyPayoutMultipliers`, `hardwareCosts[]`, `toolBaseCosts`, `versionBoostBase`, `reputationDiscountFactors`, `decayStep`, `traceBaseRatesByDifficulty`.

Transaction Ledger:

- Append-only list capped to last 20 entries; older entries dropped.

## 12. Security Defenses & Adaptation

Archetypes (v1 min 5):

1. Firewall
2. ICE Sentinel
3. Encryption Layer
4. Trace Accelerator
5. Honeytrap / Decoy

Each defines:

- Base tier scaling factors (time multiplier, noise spike probability, failure penalty).
- Required tool category mapping.
- Potential noise spike configuration (magnitude, duration).

Random Ordering:

- Generate order with constraint: not more than two high-noise defenses adjacent (enforce by shuffle + swap algorithm).

Adaptation Signal:

- UI event includes defenseId, newTier, reason="adaptive_increment".

## 13. UI / UX & Docking

Pane Types:

- Mission Board, Active Session, Tools Inventory, Upgrades/Market, Faction Panel, Narrative Log, Branch Map, Profile Dashboard, Ledger.

Docking Grid:

- Config: 12-column responsive grid; panes store position (x,y,width,height, zIndex) per profile.
- Persist layout after drag/resize via debounced store update (250ms) → autosave triggered.

Theme:

- Dark Immersive (default) + Light Performance. CSS variable theme switch; maintain accessible contrast for critical indicators.

Routing:

- Client-side route state mirrored in store for deep linking; core panels never full page reload. Active session persists while switching to market or faction panels.

Performance UI Constraints:

- Avoid re-render storms: selectors memoized; virtualization for large logs.
- Progress bars updated at 10fps (throttle) even if internal tick 250ms.

Accessibility Basics:

- Keyboard navigation for pane focus cycle, ARIA labels on critical interactive elements.

## 14. Autosave & Manual Saves

Triggers:

- Mission completion, purchase (tool/hardware), major narrative choice (branch node resolved), profile deletion, upgrade applied.

Manual Slots:

- Minimum 3. Save includes snapshot summarizing mission count & timestamp.
- Save invocation: freeze simulation tick, snapshot state, resume after persisted or after 1s timeout fallback.

Error Handling:

- If autosave fails (quota/full): surface non-blocking toast advising manual cleanup; queue retry exponential backoff.

## 15. Performance Targets & Strategies

Targets:

- Cold Load < 3s (25Mbps mid laptop). Strategy: code splitting (React lazy), compress content JSON, preparse minimal subset for initial console.
- Interaction Latency < 150ms: event → state update < 16ms typical; heavy computation moved to Web Worker candidate (deferred unless profiling shows >10ms per tick).
- Memory < 500MB: Cap cached mission objects, purge least recently used mission definitions not active.

Profiling Plan:

- Add dev instrumentation capturing tick durations, mission generation time, largest JSON parse sizes.

Optimization:

- Use structural sharing (immutable updates) to reduce GC churn.
- Lazy load branch map only after first branch completion.

## 16. Testing & QA Strategy

Test Pyramid:

- Unit: Pure functions (economy calculations, trace rate, adaptation increments, flag evaluation).
- Simulation: Deterministic mission run with seeded RNG verifying tool progression & trace fail conditions.
- Integration: Full hacking session from accept → success/failure with autosave triggers intercepted via mock persistence.
- UI Component Tests: Pane docking, mission filters, trace meter update frequency.
- End-to-End (Playwright/Cypress): Create profile → accept mission → run tools → complete → purchase upgrade → observe progression dashboard updated <1s.

Representative Test Cases per AC (Samples):

- AC (Profile uniqueness): Creating duplicate username fails validation.
- AC (Mission filtering): Locked mission returns required tool tier hint text.
- AC (Trace on failure): Fill trace triggers mission fail state & reputation penalty entry.
- AC (Log scrub success): After scrub & success, detection penalty probability state < 0.10.
- AC (Tool version improvement): Version n+1 runtime ≤ 0.9 \* version n runtime.
- AC (Adaptive defense): After first failure, subsequent attempt sees effective tier +1.

Determinism:

- Provide seed injection for simulation tests; assert derived run durations & trace deltas reproducible.

Edge Cases:

- Empty mission board (all locked) – shows reasons, no crash.
- Save corruption – gracefully loads backup.
- Profile deletion during active mission – abort mission and purge instance data.

## 17. Implementation Roadmap

Milestone A (Foundations): Profiles, basic mission board (static missions), minimal hacking loop (Firewall + Encryption), credits ledger, hardware tier 1, tool purchase basics, persistence scaffolding.
Milestone B (Depth): Add trace system, log scrub, multiple defense archetypes, factions (basic rep tracking), tool versions performance scaling.
Milestone C (Branching): Implement narrative nodes, branch choices, endings tracking, branch map UI.
Milestone D (Polish & Performance): Adaptive defenses, docking layout, theming, balance iteration, profiling, final QA & tuning.

Milestone Task Breakdown (Sample Sequence):

1. Persistence layer + schema baseline
2. Profile creation & auth hash
3. Core store slices scaffold
4. Content schema & loader
5. Mission acceptance & instance generation
6. Basic hacking tick engine
7. Tool execution + defense resolution (Firewall, Encryption only)
8. Economy ledger + payouts
9. Hardware upgrade purchase
10. Tool version scaling
11. Add defense archetypes & noise
12. Trace system integration
13. Log system & scrub mechanic
14. Faction reputation + gating
15. Narrative flags & branch nodes
16. Endings tracking & summary map
17. Docking layout system
18. Autosave orchestration
19. Adaptive defenses
20. Performance instrumentation & optimization
21. Test harness & coverage expansion
22. Balance config tuning iteration

## 18. Risk Mitigation & Quality Gates

Risks (From PRD) → Controls:

- Balance Grind → External config + simulation tests of mission-to-upgrade timeline.
- Shallow Hacking → Ensure multi-layer & adaptive logic test cases.
- Scope Creep in Branching → Enforce node count budget via lint rule on content directory.
- Performance Degradation → Profiling thresholds fail CI if tick >20ms p95 in test simulation.
- Save Corruption → Checksum validation + backup rollback tests.

Quality Gates (CI):

- Schema validation of all content files.
- Type check & lint (ESLint) must pass.
- Minimum unit test coverage for core engines (e.g., >80% of simulation module lines/functions).
- Deterministic simulation snapshot tests stable across 3 consecutive runs.
- Performance micro-benchmark (trace accumulation) within budget.

## 19. Acceptance Criteria Coverage Matrix (Excerpt)

(Each PRD AC mapped to Section):

- Profile creation & persistence (US-PROF-1 AC1-4) → Sections 4,5,14,16.
- Progress dashboard (US-PROF-2) → Sections 5,12,16.
- Difficulty gating (US-PROF-3) → Sections 7,10.
- Scan visualization (US-HACK-1) → Sections 7,8 (defense reveal), 12 (UI pacing).
- Tool deployment & concurrency (US-HACK-2) → Sections 7,10.
- Trace meter (US-HACK-3) → Sections 7,16.
- Log scrub (US-HACK-4) → Section 7.
- Mission board & filters (US-MISS-1) → Section 7,12.
- Objectives panel (US-MISS-2) → Sections 7,12.
- Bonus conditions (US-MISS-3) → Section 7.
- Abandon mission (US-MISS-4) → Section 7.
- Story branching & endings (US-STORY-1/2/3) → Section 9.
- Faction reputation & consequences (US-FACT-1/2) → Sections 10,11.
- Hardware & software upgrades (US-UPG-1/2/3) → Section 10.
- Economy scaling & ledger (US-ECON-1/2) → Sections 10,11,16.
- Security defenses & adaptation (US-SEC-1/2) → Sections 11,7.
- UI console & docking (US-UI-1) → Section 12.
- SPA experience (US-UI-2) → Sections 3,12.
- Autosave & version-safe saves (US-PERS-1/2) → Sections 5,14.
- Performance targets (US-TECH-1) → Section 15.
- Modular mission/narrative systems (US-TECH-2) → Sections 3,7,9.

## 20. Logging & Telemetry (Local Only)

- In-memory structured log buffer (debug build) for simulation events.
- Export diagnostic bundle for QA (no remote transmission v1).

## 21. Open Implementation Questions

(If not clarified, assumptions stand)

1. Password hashing library availability offline (assume WebCrypto PBKDF2 fallback). Confirm acceptable.
2. In-game day definition for reputation decay (assume: each completed mission increments day counter). Need product confirmation.
3. Partial log scrub detection penalty formula unspecified (assume simple probability table in config). Future refinement.

## 22. Assumptions Summary

- Single active hacking session at a time.
- Deterministic randomization seeded per mission acceptance.
- Narrative flag expressions limited to shallow AND/OR forms.
- No multi-profile simultaneous sessions (one active selected).
- Memory budget prudently set; not enforcing hard cap beyond instrumentation alerts.

## 23. Future Extensibility Hooks

- Network Sync Adapter interface (unused v1) for potential cloud saves.
- Plugin registry for new defense archetypes & tool categories (function signature documented internally).
- Worker offload point for heavy simulation if complexity grows.

## 24. Glossary

- Defense Archetype: Template classification (Firewall, ICE, etc.).
- Noise Spike: Temporary increase in trace accumulation rate.
- Adaptive Defense: Defense that increases effective tier after failure.
- Branch Node: Narrative decision point.
- Silhouette Node: Hidden future narrative node placeholder.

---

End of Technical Specification.
