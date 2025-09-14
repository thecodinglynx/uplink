import { describe, it, expect } from 'vitest';
import { generateDefenseInstances } from '../src/domain/defense/ordering';
import { createSession } from '../src/domain/hacking/engine';
import { makeId, DefenseArchetype } from '../src/domain/types';
const template = [
    { archetype: DefenseArchetype.FIREWALL, minTier: 1, maxTier: 2 },
    { archetype: DefenseArchetype.ICE_SENTINEL, minTier: 1, maxTier: 3, highNoise: true },
    { archetype: DefenseArchetype.ENCRYPTION_LAYER, minTier: 1, maxTier: 2 },
    { archetype: DefenseArchetype.TRACE_ACCELERATOR, minTier: 2, maxTier: 3, highNoise: true },
];
describe('multi-seed determinism', () => {
    it('defense generation consistent per seed', () => {
        const seeds = [11, 22, 333, 4444];
        for (const s of seeds) {
            const first = generateDefenseInstances(template, { seed: s, now: 1 })
                .map((d) => `${d.archetype}:${d.tier}`)
                .join('|');
            const second = generateDefenseInstances(template, { seed: s, now: 999 })
                .map((d) => `${d.archetype}:${d.tier}`)
                .join('|');
            expect(first).toBe(second);
        }
    });
    it('session defense ordering reproducible with same seed', () => {
        const seed = 777;
        const a = createSession(makeId('mA'), seed, Date.now(), { defenseCount: 5 });
        const b = createSession(makeId('mB'), seed, Date.now() + 1000, {
            defenseCount: 5,
        });
        const sigA = a.defenses.map((d) => `${d.archetype}:${d.tier}`).join('|');
        const sigB = b.defenses.map((d) => `${d.archetype}:${d.tier}`).join('|');
        expect(sigA).toBe(sigB);
    });
});
