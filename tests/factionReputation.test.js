import { describe, it, expect } from 'vitest';
import { makeId } from '../src/domain/types';
import { adjustReputation, applyDecay, getFactionLabel } from '../src/domain/factions/reputation';
function profile() {
    return {
        id: makeId('p1'),
        username: 'u',
        passwordHash: 'h',
        credits: 0,
        hardwareTierId: makeId('tier1'),
        ownedToolVersions: [],
        narrativeFlags: [],
        factionReputations: [],
        endingsUnlocked: [],
        layoutPreferences: { panes: [], theme: 'dark' },
        stats: { missionsCompleted: 0, completionPercent: 0 },
        version: 1,
    };
}
const factions = [
    {
        id: makeId('f1'),
        name: 'F1',
        description: '',
        thresholds: { hostile: -50, trusted: 30, allied: 70 },
    },
    {
        id: makeId('f2'),
        name: 'F2',
        description: '',
        thresholds: { hostile: -50, trusted: 25, allied: 60 },
    },
];
describe('faction reputation', () => {
    it('records threshold transitions and exclusive allied lock', () => {
        let p = profile();
        // raise f1 to allied
        p = adjustReputation(p, factions, factions[0].id, 80, Date.now(), 'boost').profile;
        expect(getFactionLabel(factions, factions[0].id, p.factionReputations[0].value)).toBe('ALLIED');
        // attempt raising f2 to allied should demote it back to trusted because f1 holds allied slot
        const res2 = adjustReputation(p, factions, factions[1].id, 70, Date.now(), 'boost2');
        p = res2.profile;
        const f2Rec = p.factionReputations.find((r) => r.factionId === factions[1].id);
        // Should be clamped to at most trusted threshold due to exclusivity
        expect(f2Rec.value).toBeLessThanOrEqual(factions[1].thresholds.trusted);
    });
    it('applies decay toward zero after inactivity', () => {
        let p = profile();
        p = adjustReputation(p, factions, factions[0].id, 40, Date.now() - 10_000, 'early').profile;
        const before = p.factionReputations[0].value;
        p = applyDecay(p, factions, Date.now(), { inactivityMs: 1000, decayStep: 5 });
        const after = p.factionReputations[0].value;
        expect(after).toBeLessThan(before);
    });
});
