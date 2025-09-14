import { describe, it, expect } from 'vitest';
import { makeId, ToolCategory, } from '@domain/types';
import { purchaseHardwareUpgrade, purchaseToolVersion, getToolOperationTimeModifier, getHardwareConcurrencySlots, } from '@domain/upgrades/upgradeManager';
function profile() {
    return {
        id: makeId('p1'),
        username: 'u',
        passwordHash: 'h',
        credits: 10_000,
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
const tiers = [
    {
        id: makeId('tier1'),
        version: 1,
        concurrencySlots: 1,
        memoryCapacity: 256,
        traceResistance: 0.05,
        cost: 0,
        visualKey: 't1',
    },
    {
        id: makeId('tier2'),
        version: 1,
        concurrencySlots: 2,
        memoryCapacity: 512,
        traceResistance: 0.1,
        cost: 1500,
        visualKey: 't2',
    },
    {
        id: makeId('tier3'),
        version: 1,
        concurrencySlots: 3,
        memoryCapacity: 1024,
        traceResistance: 0.15,
        cost: 4000,
        visualKey: 't3',
    },
];
const tool = {
    id: makeId('scanner'),
    category: ToolCategory.SCANNER,
    minHardwareTier: tiers[0].id,
    description: 'Scanner tool',
    versions: [
        {
            version: 1,
            baseOperationTimeModifier: 0.95,
            noiseFactor: 1,
            successTierOffset: 0,
            cost: 200,
        },
        {
            version: 2,
            baseOperationTimeModifier: 0.85,
            noiseFactor: 0.95,
            successTierOffset: 0,
            cost: 400,
        },
    ],
};
describe('upgrade manager', () => {
    it('upgrades hardware increasing concurrency slots', () => {
        let p = profile();
        expect(getHardwareConcurrencySlots(tiers, p.hardwareTierId)).toBe(1);
        const res = purchaseHardwareUpgrade(p, tiers, Date.now());
        p = res.profile;
        expect(p.hardwareTierId).toBe(tiers[1].id);
        expect(getHardwareConcurrencySlots(tiers, p.hardwareTierId)).toBe(2);
    });
    it('purchases sequential tool versions improving speed', () => {
        let p = profile();
        const v1 = purchaseToolVersion(p, tool, tiers, 1, Date.now());
        p = v1.profile;
        expect(getToolOperationTimeModifier(tool, 1)).toBeLessThan(1);
        const v2 = purchaseToolVersion(p, tool, tiers, 2, Date.now());
        p = v2.profile;
        expect(getToolOperationTimeModifier(tool, 2)).toBeLessThan(getToolOperationTimeModifier(tool, 1));
    });
    it('rejects skipping versions', () => {
        let p = profile();
        expect(() => purchaseToolVersion(p, tool, tiers, 2, Date.now())).toThrow();
    });
});
