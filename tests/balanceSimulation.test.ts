import { describe, it, expect } from 'vitest';
import { runBalanceSimulation } from '../src/simulation/balanceRunner';
import { DefenseArchetype, type DefenseTemplateSlot } from '../src/domain/types';

const template: DefenseTemplateSlot[] = [
  { archetype: DefenseArchetype.FIREWALL, minTier: 1, maxTier: 2 },
  { archetype: DefenseArchetype.ICE_SENTINEL, minTier: 1, maxTier: 3, highNoise: true },
  { archetype: DefenseArchetype.ENCRYPTION_LAYER, minTier: 1, maxTier: 2 },
  { archetype: DefenseArchetype.TRACE_ACCELERATOR, minTier: 2, maxTier: 3, highNoise: true },
  { archetype: DefenseArchetype.HONEYTRAP, minTier: 1, maxTier: 1, highNoise: true },
];

describe('balance simulation harness', () => {
  it('produces deterministic signatures per seed', () => {
    const seeds = [101, 202, 303];
    const result1 = runBalanceSimulation({ seeds, template });
    const result2 = runBalanceSimulation({ seeds, template });
    expect(result1.seedSignatures['101']).toBe(result2.seedSignatures['101']);
    expect(result1.avgDefenseCount).toBeGreaterThan(0);
    expect(result1.avgPayout).toBeGreaterThan(0);
    // Deterministic payouts
    expect(result1.avgPayout).toBeCloseTo(result2.avgPayout, 5);
    expect(result1.medianPayout).toBe(result2.medianPayout);
    expect(result1.traceFailureRate).toBeGreaterThanOrEqual(0);
    expect(result1.traceFailureRate).toBeLessThanOrEqual(1);
    expect(result1.payoutQuantiles.q10).toBeLessThanOrEqual(result1.payoutQuantiles.q90);
    const bucketSum =
      result1.payoutBuckets.low + result1.payoutBuckets.mid + result1.payoutBuckets.high;
    expect(bucketSum).toBeCloseTo(1, 5);
  });
});
