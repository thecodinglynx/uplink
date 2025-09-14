import { describe, it, expect } from 'vitest';
import { makeId, DifficultyBand, type MissionDefinition, type ProfileDefinition } from '@domain/types';
import {
  getMissionAvailabilities,
  acceptMission,
  abandonMission,
  purgeExpiredMissions,
} from '@domain/mission/missionManager';

function baseProfile(): ProfileDefinition {
  return {
    id: makeId<'ProfileId'>('p1'),
    username: 'user',
    passwordHash: 'x',
    credits: 100,
    hardwareTierId: makeId<'HardwareTierId'>('tier1'),
    ownedToolVersions: [
      { toolId: makeId<'ToolId'>('scanner'), version: 1 },
      { toolId: makeId<'ToolId'>('cracker'), version: 2 },
    ],
    narrativeFlags: ['intro_done'],
    factionReputations: [
      { factionId: makeId<'FactionId'>('corpA'), value: 10, lastUpdated: Date.now() },
    ],
    endingsUnlocked: [],
    layoutPreferences: { panes: [], theme: 'dark' },
    stats: { missionsCompleted: 0, completionPercent: 0 },
    version: 1,
  };
}

function simpleMission(id: string, overrides: Partial<MissionDefinition> = {}): MissionDefinition {
  return {
    id: makeId<'MissionId'>(id),
    title: id,
    type: 'standard',
    factions: [makeId<'FactionId'>('corpA')],
    difficultyBand: DifficultyBand.EASY,
    basePayoutRange: [100, 150],
    objectives: [
      { id: makeId<'ObjectiveId'>('o1'), type: 'scan', targetCount: 1 },
    ],
    defenseTemplate: [],
    seedMode: 'FIXED',
    version: 1,
    ...overrides,
  };
}

describe('missionManager gating', () => {
  it('flags mission unavailable when missing flag and tool version', () => {
    const profile = baseProfile();
    profile.narrativeFlags = []; // remove intro_done
    const mission = simpleMission('m1', {
      gates: {
        requiredFlags: ['intro_done'],
        requiredToolVersions: [
          { toolId: makeId<'ToolId'>('scanner'), minVersion: 2 }, // have only v1
        ],
      },
    });
  const ctx = {
      profile,
      missions: [mission],
      factionRepLookup: () => 10,
      now: Date.now(),
      acceptedMissions: {},
    };
    const avail = getMissionAvailabilities(ctx);
    expect(avail[0].available).toBe(false);
    expect(avail[0].reasons.length).toBe(2);
  });

  it('accepts mission when all gates satisfied', () => {
    const profile = baseProfile();
    const mission = simpleMission('m2', {
      gates: {
        requiredFlags: ['intro_done'],
        requiredToolVersions: [
          { toolId: makeId<'ToolId'>('scanner'), minVersion: 1 },
        ],
      },
    });
    const ctx: any = {
      profile,
      missions: [mission],
      factionRepLookup: () => 10,
      now: Date.now(),
      acceptedMissions: {} as Record<ReturnType<typeof makeId<'MissionId'>>, { acceptedAt: number }> ,
    };
    const result = acceptMission(ctx, mission.id);
    expect(result.ok).toBe(true);
  expect(ctx.acceptedMissions[mission.id]).toBeDefined();
  });

  it('applies abandonment penalty and removes mission', () => {
    const profile = baseProfile();
    const mission = simpleMission('m3', {
      abandonment: { mode: 'returnsToPool', penaltyCredits: 25 },
    });
    const ctx: any = {
      profile,
      missions: [mission],
      factionRepLookup: () => 0,
      now: Date.now(),
      acceptedMissions: {} as Record<ReturnType<typeof makeId<'MissionId'>>, { acceptedAt: number }> ,
    };
    const acc = acceptMission(ctx, mission.id);
    expect(acc.ok).toBe(true);
    const ab = abandonMission(ctx, mission.id);
    expect(ab.ok).toBe(true);
    expect(ab.penaltyApplied).toBe(25);
  expect(ctx.acceptedMissions[mission.id]).toBeUndefined();
  });

  it('purges expired missions based on hard time', () => {
    const profile = baseProfile();
    const mission = simpleMission('m4', {
      abandonment: { mode: 'expires' },
      timeConstraints: { hardSeconds: 10 },
    });
    const acceptedAt = Date.now() - 11_000; // 11s ago
    const ctx: any = {
      profile,
      missions: [mission],
      factionRepLookup: () => 0,
      now: Date.now(),
      acceptedMissions: { [mission.id]: { acceptedAt } } as Record<ReturnType<typeof makeId<'MissionId'>>, { acceptedAt: number }> ,
    };
    const removed = purgeExpiredMissions(ctx);
    expect(removed).toContain(mission.id);
  expect(ctx.acceptedMissions[mission.id]).toBeUndefined();
  });
});
