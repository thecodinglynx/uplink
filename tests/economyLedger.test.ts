import { describe, it, expect } from 'vitest';
import {
  makeId,
  type ProfileDefinition,
  type FactionDefinition,
  ToolCategory,
} from '@domain/types';
import {
  createLedger,
  earnCredits,
  spendCredits,
  applyFactionDiscount,
} from '@domain/economy/ledger';

function profile(): ProfileDefinition {
  return {
    id: makeId<'ProfileId'>('p1'),
    username: 'u',
    passwordHash: 'h',
    credits: 1000,
    hardwareTierId: makeId<'HardwareTierId'>('tier1'),
    ownedToolVersions: [],
    narrativeFlags: [],
    factionReputations: [],
    endingsUnlocked: [],
    layoutPreferences: { panes: [], theme: 'dark' },
    stats: { missionsCompleted: 0, completionPercent: 0 },
    version: 1,
  };
}

describe('economy ledger', () => {
  it('records earnings and spend with running balance', () => {
    let p = profile();
    let ledger = createLedger();
    ({ profile: p, ledger } = earnCredits(p, ledger, 500, { reason: 'mission', now: Date.now() }));
    expect(p.credits).toBe(1500);
    ({ profile: p, ledger } = spendCredits(p, ledger, 200, { reason: 'upgrade', now: Date.now() }));
    expect(p.credits).toBe(1300);
    expect(ledger.transactions.length).toBe(2);
    expect(ledger.transactions[0].amount).toBe(500);
    expect(ledger.transactions[1].amount).toBe(-200);
  });

  it('applies highest matching discount', () => {
    const factions: FactionDefinition[] = [];
    const discounted = applyFactionDiscount(
      1000,
      factions,
      [
        { percent: 5 },
        { toolCategory: ToolCategory.SCANNER, percent: 15 },
        { toolCategory: ToolCategory.CRACKER, percent: 20 },
      ],
      ToolCategory.SCANNER,
    );
    expect(discounted).toBe(850);
  });
});
