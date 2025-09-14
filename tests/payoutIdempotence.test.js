import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer, startSession, queueRun, tickSession } from '../src/store/sessionSlice';
import { ledgerReducer } from '../src/store/ledgerSlice';
import { missionsReducer, hydrateMissions, setActiveMission } from '../src/store/missionsSlice';
import { payoutMiddleware } from '../src/store/middleware/payout';
const mission = {
    id: 'm_idem',
    title: 'Idempotence Mission',
    type: 'procedural',
    factions: [],
    difficultyBand: 'EASY',
    basePayoutRange: [100, 120],
    objectives: [{ id: 'obj1', type: 'exfiltrate', targetCount: 1 }],
    defenseTemplate: [{ archetype: 'FIREWALL', minTier: 1, maxTier: 1 }],
    seedMode: 'FIXED',
    version: 1,
};
describe('payout idempotence', () => {
    it('awards payout only once', () => {
        const store = configureStore({
            reducer: { session: sessionReducer, ledger: ledgerReducer, missions: missionsReducer },
            middleware: (gDM) => gDM().concat(payoutMiddleware),
        });
        globalThis.__LATEST_STORE_STATE__ = store.getState();
        store.subscribe(() => (globalThis.__LATEST_STORE_STATE__ = store.getState()));
        store.dispatch(hydrateMissions([mission]));
        store.dispatch(setActiveMission(mission.id));
        store.dispatch(startSession({ missionId: mission.id, seed: 999 }));
        const defs = store.getState().session.active.defenses.map((d) => d.id);
        for (const id of defs)
            store.dispatch(queueRun({ defenseId: id, toolId: 'SCANNER_TOOL' }));
        for (let t = 0; t < 50; t++) {
            store.dispatch(tickSession({ now: Date.now() + t * 1000 }));
            const s = store.getState().session.active;
            if (s && s.status === 'success')
                break;
        }
        const creditsAfterSuccess = store.getState().ledger.profile.credits;
        // Extra ticks should not increase credits
        for (let extra = 0; extra < 5; extra++) {
            store.dispatch(tickSession({ now: Date.now() + 60000 + extra * 1000 }));
        }
        expect(store.getState().ledger.profile.credits).toBe(creditsAfterSuccess);
    });
});
