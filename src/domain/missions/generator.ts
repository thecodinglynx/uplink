import { DifficultyBand } from '../types';
import type { MissionDefinition, MissionId } from '../types';

// Very lightweight procedural mission generator used for bootstrapping the UI.
// Produces missions spanning EASY->MEDIUM->HARD with increasing payout ranges.
export function generateSimpleMissions(count: number): MissionDefinition[] {
  const arr: MissionDefinition[] = [];
  for (let i = 1; i <= count; i++) {
    const band: DifficultyBand =
      i <= 3 ? DifficultyBand.EASY : i <= 6 ? DifficultyBand.MID : DifficultyBand.HARD;
    const base = 150 + i * 25; // escalating base anchor
    const variance = Math.round(base * 0.4);
    const low = Math.max(50, base - variance);
    const high = base + variance;
    arr.push({
      id: `m_gen_${i}` as MissionId,
      title: `Procedural Mission ${i}`,
      type: 'procedural',
      factions: [],
      difficultyBand: band,
      basePayoutRange: [low, high],
      objectives: [
        {
          id: `obj_${i}_1` as any,
          type: 'exfiltrate',
          targetCount: 1,
        },
      ],
      defenseTemplate: [
        { archetype: 'FIREWALL' as any, minTier: 1, maxTier: 2 },
        { archetype: 'IDS' as any, minTier: 1, maxTier: 2, highNoise: i % 2 === 0 },
      ],
      reputationEffects: [],
      seedMode: 'FIXED',
      version: 1,
    });
  }
  return arr;
}
