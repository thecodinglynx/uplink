# QA Coverage Mapping

This document maps major feature areas to automated test files and provides a quick count of assertions.

| Feature Area                 | Description                                            | Test Files                                                                               |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Content Loading & Validation | Schema validation, hashing, loading pipeline           | contentLoader.test.(ts/js), domainTypesGuards.test.(ts/js)                               |
| Persistence & Autosave       | Save/load roundtrip, immutability, initial state shape | persistence.test.(ts/js), storeInitialState.test.(ts/js), storeImmutability.test.(ts/js) |
| Mission Management           | Mission generation, gating logic                       | missionManager.test.(ts/js)                                                              |
| Hacking Engine Core          | Session creation, tool run queue, update loop          | hackingEngine.test.(ts/js)                                                               |
| Trace & Adaptive Defenses    | Trace progression, adaptive behavior                   | traceAdaptive.test.(ts/js)                                                               |
| Log Scrubbing                | Removal / redaction logic                              | logsScrub.test.(ts/js)                                                                   |
| Narrative Branching          | Branch selection, state transitions                    | narrativeBranching.test.(ts/js)                                                          |
| Factions & Reputation        | Reputation adjustment, exclusivity of ALLIED           | factionReputation.test.(ts/js)                                                           |
| Upgrades System              | Hardware tiers, tool version benefits                  | upgradeManager.test.(ts/js)                                                              |
| Economy & Ledger             | Credit earn/spend, discount application                | economyLedger.test.(ts/js)                                                               |
| Defense Ordering Constraints | High-noise adjacency constraint & determinism          | defenseOrdering.test.(ts/js), determinismMultiSeed.test.ts                               |
| Determinism Assurance        | Multi-seed reproducibility for defenses & sessions     | determinismMultiSeed.test.ts                                                             |
| Instrumentation              | Performance metric recording                           | instrumentation.test.ts                                                                  |
| Simulation Harness           | Aggregate metrics (payout, trace, tiers)               | balanceSimulation.test.ts                                                                |
| Type Guards & Sample Types   | Basic type guard correctness                           | sampleType.test.(ts/js), domainTypesGuards.test.(ts/js)                                  |

## Notes

- Duplicate .js and .ts test files ensure both transpiled JS consumption and TypeScript source paths remain stable.
- Determinism tests provide baseline for future balance tuning against regressions.
- Additional future coverage candidates: UI interaction tests (pending richer UI), accessibility tree snapshot tests, performance regression thresholds.
