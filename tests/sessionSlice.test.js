import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer, startSession, tickSession, queueRun } from '../src/store/sessionSlice';
describe('session slice basic loop', () => {
    it('starts session, queues run, ticks progress', () => {
        const store = configureStore({ reducer: { session: sessionReducer } });
        store.dispatch(startSession({ missionId: 'm1', seed: 42 }));
        let state = store.getState().session;
        expect(state.active).toBeTruthy();
        const defenseId = state.active.defenses[0].id;
        store.dispatch(queueRun({ defenseId, toolId: 'generic_tool' }));
        // simulate time advance
        const start = Date.now();
        store.dispatch(tickSession({ now: start + 1500 }));
        state = store.getState().session;
        const def = state.active.defenses[0];
        expect(def.currentProgress).toBeGreaterThan(0);
    });
});
