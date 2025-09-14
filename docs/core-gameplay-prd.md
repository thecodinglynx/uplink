# Core Gameplay & Narrative Platform PRD

## Document Control

- Version: 0.1 (Draft)
- Owner: Product Management
- Last Updated: 2025-09-13
- Status: Draft for stakeholder review

## 1. Summary

We are building a browser-based narrative hacking simulation inspired by the strategic progression and stylized "cinematic hacking" feel of classic genre predecessors, modernized for a React-based web stack. The product delivers a single‑player branching story mode plus an open contract-driven gameplay loop where players earn credits and reputation to unlock hardware and software upgrades. Player choices meaningfully branch plot arcs and faction outcomes.

## 2. Goals & Non‑Goals

### 2.1 Goals

- Deliver immersive, diegetic UI that makes players feel like operating a retro‑future intrusion console.
- Provide a scalable mission/contract system with procedural + authored tasks.
- Enable branching narrative with at least two major faction paths and multiple endings in v1 (tone: light, witty, PG‑13 humor).
- Implement upgrade economy (hardware gateway + modular software tools) affecting capability & strategy.
- Support fully offline local persistence (no servers required) for player profile, progress, inventory, narrative state, and branching flags.
- Ensure acceptable performance on basic commodity hardware and modern evergreen desktop browsers.
- Maintain internally adjustable balance via externalized config (no live analytics dependency).

### 2.2 Non‑Goals (v1)

- Monetization (no in‑game purchases / ads / premium upsell mechanics).
- Online / multiplayer features (entirely offline single‑player experience).
- Cloud saves (local only for v1).
- Realistic low‑level protocol/emulation hacking (abstract cinematic model only).
- Modding tools / user-generated content.
- Accessibility compliance beyond basic keyboard navigation (deferred).
- Localization (English only v1).
- Analytics / telemetry event capture.
- Mobile-optimized UX (desktop first; responsive layout is stretch).
- VR/AR interfaces.

## 3. Target Users & Personas

1. Explorer Analyst: Enjoys systems depth, incremental optimization, experimentation with tool combos.
2. Narrative Strategist: Focused on story branches, moral/strategic decisions, replayability.
3. Achievement Maximizer: Seeks completion metrics, optimized mission throughput, upgrade optimum path.

Primary persona for v1: Narrative Strategist (increase retention via branching outcomes).

## 4. User Problem Statement

Players want the fantasy of being an elite cyber operative navigating high‑stakes digital conflicts without needing real-world security expertise. They need an interface that feels powerful, consequences that feel meaningful, and progression that rewards risk management.

## 5. Experience Pillars

- Cinematic Abstraction: Fast, legible hacking interactions (tool vs obstacle).
- Agency & Branching: Decisions have systemic + narrative impact.
- Progressive Mastery: Unlocks expand viable strategies.
- Tension & Risk: Time pressure, trace risk, log cleanup, escalating security.
- Diegetic Interface: In‑world console aesthetic; minimal out‑of‑universe chrome.
- Playful Tone: Light, occasionally humorous flavor text and narrative beats within PG‑13 boundaries.

## 6. High-Level Feature Epics

1. Player Profile & Progression
2. Hacking Session Core Loop
3. Mission & Contract System
4. Story & Branching Narrative
5. Factions & Reputation
6. Hardware & Software Upgrades
7. Economy & Market
8. Security Systems & Countermeasures
9. UI/UX & Immersion Layer
10. Persistence & Save/Load
11. Tech Platform & Performance

## 7. Core Gameplay Loop (v1)

1. Acquire mission (board / narrative / faction contact).
2. Prepare (assess security level, equip tools, optional upgrade purchase).
3. Execute intrusion (bypass layered defenses under trace/time constraints).
4. Achieve objective (exfiltrate, modify, plant, neutralize, scan, etc.).
5. Cover tracks (log scrub, disconnect strategically).
6. Payout & reputation adjustment.
7. Spend credits on upgrades / advance narrative branch flags.
8. Unlock harder contracts & faction arcs.

## 8. Detailed Requirements & User Stories

(All stories follow: As a <role>, I want <capability> so that <benefit>. Acceptance Criteria (AC) are numbered.)

### 8.1 Epic: Player Profile & Progression

US-PROF-1: As a player, I want a local username/password protected profile so that my progress persists offline across sessions.

- AC1: Player can create a unique username (case-insensitive uniqueness) with a password stored via secure hash locally.
- AC2: Progress (missions completed, credits, reputation, hardware/software, narrative flags) persists after reload (IndexedDB or equivalent).
- AC3: Password validation rejects empty or trivial (<4 chars) inputs.
- AC4: Deleting a profile prompts confirmation and removes all associated state files/records.

US-PROF-2: As a player, I want a progression summary dashboard.

- AC1: Displays core metrics: level / rank (if implemented), total credits, faction reputations, completion %, endings unlocked.
- AC2: Updates within 1 second after mission completion.
- AC3: Accessible from primary console without full context loss.

US-PROF-3: As a player, I want difficulty scaling to unlock higher-tier missions.

- AC1: Mission pool gating uses thresholds (reputation, tool tier, or cumulative score).
- AC2: Locked missions show clear requirement hints.
- AC3: At least 3 distinct difficulty bands in v1.

### 8.2 Epic: Hacking Session Core Loop

US-HACK-1: As a player, I want to visualize a target system’s layered defenses before/while connecting.

- AC1: Pre-engagement scan reveals categories (Firewall, ICE, Encryption, Trace Speed) with abstract levels (e.g., 1–5).
- AC2: Unknown elements display as “?” until scan tool of sufficient tier is used.
- AC3: UI updates in <250ms after new scan results.

US-HACK-2: As a player, I want to deploy tools against defenses with feedback on progress.

- AC1: Each defense type requires matching or higher-tier tool to succeed.
- AC2: Progress bars or status tokens show active tool operations with ETA.
- AC3: Multiple tools can run concurrently up to hardware concurrency limit.
- AC4: Canceling a tool frees its slot within 200ms.

US-HACK-3: As a player, I want a trace risk indicator.

- AC1: Real-time trace meter with time-to-trace estimate.
- AC2: Actions (e.g., high-noise tools) accelerate trace rate.
- AC3: Upon full trace, mission fails and consequences applied (reputation/credit penalty, potential narrative flag).

US-HACK-4: As a player, I want to scrub logs to reduce detection after objective completion.

- AC1: Log list displays at least 3 log categories with timestamps.
- AC2: Scrub action consumes time proportional to number/size of entries.
- AC3: Remaining trace window affects chance of partial scrub (adds risk calculus).
- AC4: Successful scrub reduces post-mission detection penalty probability to <10%.

### 8.3 Epic: Mission & Contract System

US-MISS-1: As a player, I want a mission board with filterable contracts.

- AC1: Board shows mission title, type, target difficulty, payout range, faction tag.
- AC2: Filters: difficulty band, faction, type.
- AC3: Accepting a mission reserves it (removed from board) until completed/abandoned.

US-MISS-2: As a player, I want mission objectives clearly stated.

- AC1: Objectives panel persists during hacking session.
- AC2: All objective states update in real time.
- AC3: Partial credit only if defined (e.g., multi-file retrieval) and shown pre-acceptance.

US-MISS-3: As a player, I want optional bonus conditions.

- AC1: Each mission may include 0–2 bonus conditions (e.g., time limit, stealth threshold).
- AC2: Bonus rewards apply only if all mandatory objectives succeed.
- AC3: UI differentiates base vs bonus payout.

US-MISS-4: As a player, I want to abandon a mission mid-progress.

- AC1: Abandon action prompts confirmation.
- AC2: Abandoned mission returns to pool or expires (design choice) within 5 minutes.
- AC3: Reputation penalty applied if specified by mission metadata.

### 8.4 Epic: Story & Branching Narrative

US-STORY-1: As a player, I want core storyline acts with branching decisions.

- AC1: Minimum 3 acts with at least 2 major branch points.
- AC2: Each branch point sets persistent flags altering subsequent mission availability.
- AC3: At least 3 distinct endings in v1.

US-STORY-2: As a player, I want narrative choices surfaced through in-universe channels (messages, consoles).

- AC1: Choices presented via diegetic message UI (not modal browser alerts).
- AC2: Each choice shows summary consequence hint (vague but informative).
- AC3: Once confirmed, choice irreversible (except via load prior save).

US-STORY-3: As a player, I want to view a branching summary (no spoilers for unexplored paths).

- AC1: Timeline/map shows explored nodes; unexplored show as locked silhouettes.
- AC2: Endings earned labeled with unique codename.
- AC3: Accessible post first branch completion.

### 8.5 Epic: Factions & Reputation

US-FACT-1: As a player, I want faction reputation tracked numerically.

- AC1: Each mission modifies 0–2 faction scores.
- AC2: Reputation ranges produce tier labels (Hostile, Neutral, Trusted, Allied).
- AC3: Tool price discounts or unique missions unlock at threshold transitions.
- AC4: Exactly 3 factions in v1 (2 major narrative factions, 1 minor facilitator/support faction) each with distinct reputation thresholds.

US-FACT-2: As a player, I want conflicting faction choices to have consequences.

- AC1: Choosing one faction’s exclusive mission locks rival mission for that cycle.
- AC2: Reputation decay over time if inactive > X in-game days (value TBD).
- AC3: Negative reputation triggers hostile counter-missions (>= one scenario by v1 endgame).

### 8.6 Epic: Hardware & Software Upgrades

US-UPG-1: As a player, I want to purchase gateway hardware tiers.

- AC1: Each tier increases concurrency slots, memory capacity, and trace resistance (abstract stat).
- AC2: Purchase requires sufficient credits; irreversible (no refund) in v1.
- AC3: UI visually updates chassis aesthetics.

US-UPG-2: As a player, I want to buy and equip software tools with versioned levels.

- AC1: Tools list shows name, version, required hardware capabilities, cost.
- AC2: Higher version supersedes prior (auto replace inventory entry).
- AC3: Attempting to run tool without hardware requirement shows inline error.

US-UPG-3: As a player, I want upgrade impact to be meaningful.

- AC1: Version delta ≥1 reduces operation time or increases success threshold by at least 10% relative to prior version.
- AC2: Performance scaling documented in tooltips.
- AC3: At least 5 tool categories (e.g., Firewall Bypass, Decryptor, Log Scrubber, Trace Dampener, Scanner).

### 8.7 Epic: Economy & Market

US-ECON-1: As a player, I want a predictable yet scaling economy.

- AC1: Mission payouts scale with difficulty band multiplier.
- AC2: Tool & hardware pricing curve ensures average 2–3 missions per major upgrade early game, 4–5 late.
- AC3: Balance sheet tuning values externalized in config for iteration.

US-ECON-2: As a player, I want clear credit transaction history.

- AC1: Ledger shows last 20 transactions (earn/spend) with timestamps.
- AC2: Hover tooltips expand truncated descriptions.
- AC3: Negative transactions styled distinctly.

### 8.8 Epic: Security Systems & Countermeasures

US-SEC-1: As a player, I want diverse defense types requiring strategic tool sequencing.

- AC1: Minimum 5 defense archetypes with escalating tiers.
- AC2: Some defenses generate noise spikes raising trace rate temporarily.
- AC3: Randomized ordering per target within constraints (ensures replay variance).

US-SEC-2: As a player, I want adaptive countermeasures if I brute force repeatedly.

- AC1: Repeated failure on same defense increases its effective tier by +1 (once) per session.
- AC2: Adaptive boost resets after mission outcome (success/failure/disconnect).
- AC3: UI signals adaptation event (color pulse or alert line).

### 8.9 Epic: UI/UX & Immersion Layer

US-UI-1: As a player, I want a diegetic console workspace with modular panes.

- AC1: Panels dock/undock within defined grid.
- AC2: Layout persists per profile.
- AC3: Theme supports light performance mode and immersive dark mode.

US-UI-2: As a player, I want minimal page reloads (SPA experience).

- AC1: All primary flows occur within single-page app with client-side routing.
- AC2: Network transitions show non-blocking activity indicators.
- AC3: Critical operations degrade gracefully offline (view profile, inventory) if cached.

### 8.10 Epic: Persistence & Save/Load

US-PERS-1: As a player, I want autosave after key events.

- AC1: Autosave triggers post mission completion, purchase, major narrative choice.
- AC2: Autosave completes <1 second perceived, using background thread/async.
- AC3: Manual save slots (>=3) available (if account mode active).

US-PERS-2: As a player, I want version-safe saves.

- AC1: Save metadata includes schema version.
- AC2: Incompatible (future) schema gracefully warns and attempts migration if rules exist.
- AC3: Corrupted save detection isolates file rather than crashing app.

### 8.11 Epic: Tech Platform & Performance

US-TECH-1: As a player, I want responsive performance.

- AC1: Initial load <3s on 25Mbps connection / mid-range laptop (cold cache).
- AC2: Core interactions (open mission, run tool) respond <150ms client side after data available.
- AC3: Memory usage stable (<500MB in typical 1-hour session target; stretch goal <350MB).

US-TECH-2: As a team, I want modular systems for missions/narrative.

- AC1: Mission definitions externalized (JSON/YAML) with validation pipeline.
- AC2: Branch logic driven by flag evaluation engine (no hard-coded branching inside UI components).
- AC3: Adding a new mission requires no build-time code change for core loop (data only) except for new defense/tool types.

## 9. Acceptance Criteria Summary Matrix

(Traceability: Each user story contains ACs; this section ensures coverage of pillars.)

- Immersion: UI/UX ACs (US-UI-1/2, US-HACK-2/3) satisfied.
- Agency & Branching: Story & Faction ACs (US-STORY-1/2/3, US-FACT-1/2) ensure multi-ending & consequences.
- Progressive Mastery: Upgrades & Security (US-UPG-1/2/3, US-SEC-1/2).
- Tension & Risk: Trace & log scrub (US-HACK-3/4).
- Persistence: Profiles & autosave (US-PROF-1, US-PERS-1/2).

## 10. Risks & Mitigations

| Risk                                                 | Impact                 | Mitigation                                                             |
| ---------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| Balance complexity leads to grind                    | Player boredom / churn | Externalized config + structured internal playtest cadence             |
| Overly abstract hacking feels shallow                | Reduced immersion      | Layered defenses + adaptive counters + escalating tool synergy         |
| Branch scope creep                                   | Delays narrative ship  | Strict branch count limit (≥3 endings v1) & flag-driven reusable nodes |
| Performance degradation with data-driven missions    | Slow UX                | Lazy-load mission configs & cache parsed schemas                       |
| Save corruption                                      | Player loss & trust    | Versioned schema + atomic write + backup slot                          |
| Humor tone inconsistency                             | Breaks immersion       | Tone guidelines & narrative review checklist                           |
| Offline-only persistence limits future extensibility | Rework later           | Modular data layer enabling optional future sync adapter               |

## 11. Dependencies / Assumptions

- React SPA with state management (library TBD, e.g., Redux Toolkit or lightweight signal/store) — all data stored locally.
- Persistence: Local only (IndexedDB + structured serialization). No server/back-end required v1.
- Time model: In-mission ticking loop (client authoritative) acceptable for single-player.
- No anti-cheat requirement (single-player). No save obfuscation needed (plain structured data).
- English only; no localization pipeline initially.
- PG‑13 content tone: avoid explicit gore, adult themes beyond mild language / thematic hacking tension.

## 12. Open Questions

None at this time (all prior items resolved for v1 scope). Future consideration: pacing metrics will rely on qualitative playtest feedback rather than analytics.

## 13. Phased Roadmap (Indicative)

- Milestone A (Foundations): Profiles, mission board (static), basic hacking loop (firewall + decrypt), credits, basic upgrades.
- Milestone B (Depth): Trace system, log scrub, multiple defense archetypes, faction reputation basics.
- Milestone C (Branching): Story act structure, first branch point, endings scaffolding.
- Milestone D (Polish): Adaptive security, UI docking, performance tuning, humor pass, balance iteration.

## 14. Out of Scope (Revisit Later)

- Multiplayer competitive leaderboards.
- Real-time global events.
- Advanced AI narrative generation.
- Marketplace for user-generated missions.
- Monetization systems (purchases, ads, DLC frameworks).
- Cloud save synchronization.
- Analytics / telemetry stack.
- Localization & multi-language UI.
- Comprehensive accessibility conformance (WCAG) beyond basics.
- Modding / mission editor.

## 15. Approval

Pending stakeholder review of open questions and non-goal alignment.

---

End of Document.
