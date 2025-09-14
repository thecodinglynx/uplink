import { describe, it, expect } from 'vitest';
import { DefenseArchetype } from '@domain/types';
import { generateDefenseInstances } from '@domain/defense/ordering';
const template = [
    { archetype: DefenseArchetype.FIREWALL, minTier: 1, maxTier: 2 },
    { archetype: DefenseArchetype.ICE_SENTINEL, minTier: 1, maxTier: 3, highNoise: true },
    { archetype: DefenseArchetype.ENCRYPTION_LAYER, minTier: 1, maxTier: 2 },
    { archetype: DefenseArchetype.TRACE_ACCELERATOR, minTier: 2, maxTier: 3, highNoise: true },
    { archetype: DefenseArchetype.HONEYTRAP, minTier: 1, maxTier: 1, highNoise: true },
    { archetype: DefenseArchetype.FIREWALL, minTier: 1, maxTier: 2 },
    { archetype: DefenseArchetype.ENCRYPTION_LAYER, minTier: 1, maxTier: 2 },
];
describe('defense ordering constraint', () => {
    it('ensures no more than two high-noise adjacent', () => {
        const seed = 999;
        const defenses = generateDefenseInstances(template, { seed, now: Date.now() });
        let run = 0;
        let lastHigh = false;
        for (const d of defenses) {
            const h = !!d.highNoise;
            if (h) {
                run = lastHigh ? run + 1 : 1;
                expect(run).toBeLessThanOrEqual(2);
            }
            else
                run = 0;
            lastHigh = h;
        }
    });
    it('deterministic ordering for same seed', () => {
        const seed = 12345;
        const first = generateDefenseInstances(template, { seed, now: 1 })
            .map((d) => d.archetype)
            .join(',');
        const second = generateDefenseInstances(template, { seed, now: 2 })
            .map((d) => d.archetype)
            .join(',');
        expect(first).toBe(second);
    });
    it('tiers within template ranges', () => {
        const seed = 42;
        const defenses = generateDefenseInstances(template, { seed, now: Date.now() });
        defenses.forEach((d, idx) => {
            const source = template.find((t) => t.archetype === d.archetype);
            expect(d.tier).toBeGreaterThanOrEqual(source.minTier);
            expect(d.tier).toBeLessThanOrEqual(source.maxTier);
        });
    });
});
