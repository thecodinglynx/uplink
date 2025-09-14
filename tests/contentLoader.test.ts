import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadMissions, loadNarrativeNodes, loadEconomyConfig } from '../src/content/loader';

const contentDir = path.join('content');
const missionsDir = path.join(contentDir, 'missions');
const narrativeDir = path.join(contentDir, 'narrative');

beforeAll(() => {
  fs.mkdirSync(missionsDir, { recursive: true });
  fs.mkdirSync(narrativeDir, { recursive: true });
  // Valid mission
  fs.writeFileSync(
    path.join(missionsDir, 'm1.json'),
    JSON.stringify({
      id: 'm1',
      title: 'Test Mission',
      type: 'standard',
      factions: ['fac1'],
      difficultyBand: 'EASY',
      basePayoutRange: [100, 150],
      objectives: [{ id: 'o1', type: 'scan', targetCount: 1 }],
      defenseTemplate: [{ archetype: 'FIREWALL', minTier: 1, maxTier: 1 }],
      seedMode: 'FIXED',
      version: 1,
    }),
  );
  // Invalid mission (missing objectives)
  fs.writeFileSync(
    path.join(missionsDir, 'm_invalid.json'),
    JSON.stringify({
      id: 'm_invalid',
      title: 'Bad Mission',
      type: 'standard',
      factions: [],
      difficultyBand: 'EASY',
      basePayoutRange: [10, 20],
      defenseTemplate: [{ archetype: 'FIREWALL', minTier: 1, maxTier: 1 }],
      seedMode: 'FIXED',
      version: 1,
    }),
  );
  // Narrative node valid
  fs.writeFileSync(
    path.join(narrativeDir, 'n1.json'),
    JSON.stringify({ id: 'n1', act: 1, version: 1 }),
  );
  // Economy
  fs.writeFileSync(
    path.join(contentDir, 'economy.json'),
    JSON.stringify({
      difficultyMultipliers: { EASY: 1, MID: 1.2, HARD: 1.5, ELITE: 2 },
      pricingCurves: { hardware: [100, 200], toolBase: 50, versionBoostBase: 0.12 },
      upgradeCostScaling: 1.15,
      payoutBalancing: { earlyGameFactor: 1, lateGameFactor: 1.3 },
      toolVersionPerformanceIncrement: 0.12,
      reputationDiscountFactors: { trusted: 0.05, allied: 0.1 },
      decayStep: 2,
      traceBaseRatesByDifficulty: { EASY: 1, MID: 2, HARD: 3, ELITE: 4 },
      version: 1,
    }),
  );
});

describe('content loader', () => {
  it('loads valid mission and rejects invalid', () => {
    const result = loadMissions(missionsDir);
    expect(result.items.length).toBe(1);
    expect(result.errors.length).toBe(1);
  });

  it('produces stable hash for same content ordering independent', () => {
    const a = loadMissions(missionsDir).hash;
    const b = loadMissions(missionsDir).hash;
    expect(a).toBe(b);
  });

  it('loads narrative nodes & economy config', () => {
    const n = loadNarrativeNodes(narrativeDir);
    const e = loadEconomyConfig(path.join(contentDir, 'economy.json'));
    expect(n.items.length).toBe(1);
    expect(e.items.length).toBe(1);
    expect(e.hash).not.toBe('');
  });
});
