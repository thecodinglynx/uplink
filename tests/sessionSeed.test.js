import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer, startSession } from '../src/store/sessionSlice';
import { missionsReducer, hydrateMissions, setActiveMission } from '../src/store/missionsSlice';
import { ledgerReducer } from '../src/store/ledgerSlice';
import { profilesReducer } from '../src/store/profilesSlice';
import { uiReducer } from '../src/store/uiSlice';
function makeStore() {
    return configureStore({
        reducer: {
            session: sessionReducer,
            missions: missionsReducer,
            ledger: ledgerReducer,
            profiles: profilesReducer,
            ui: uiReducer,
        },
    });
}
describe('session seed persistence', () => {
    it('stores provided seed on session start', () => {
        const store = makeStore();
        // Minimal mission catalog injection
        store.dispatch(hydrateMissions([
            {
                id: 'm1',
                title: 'Test',
                type: 'TEST',
                factions: [],
                difficultyBand: 0,
                basePayoutRange: [10, 20],
                objectives: [],
                defenseTemplate: [],
                seedMode: 'FIXED',
                version: 1,
            },
        ]));
        store.dispatch(setActiveMission('m1'));
        store.dispatch(startSession({ missionId: 'm1', seed: 4242 }));
        const state = store.getState();
        expect(state.session.active?.seed).toBe(4242);
    });
});
