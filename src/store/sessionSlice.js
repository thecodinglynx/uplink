import { createSlice } from '@reduxjs/toolkit';
import { DifficultyBand } from '../domain/types';
import { createSession, queueToolRun, updateSession } from '../domain/hacking/engine';
const initialState = {
    tickIntervalMs: 500,
    concurrencyLimit: 2,
};
const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        startSession(state, action) {
            const { missionId, seed } = action.payload;
            state.active = createSession(missionId, seed, Date.now(), { defenseCount: 5 });
        },
        queueRun(state, action) {
            if (!state.active)
                return;
            queueToolRun(state.active, action.payload.toolId, action.payload.defenseId, Date.now(), 3000, state.concurrencyLimit);
        },
        tickSession(state, action) {
            if (!state.active)
                return;
            const beforeStatus = state.active.status;
            updateSession(state.active, action.payload.now, state.concurrencyLimit);
            const afterStatus = state.active.status;
            if (beforeStatus === 'active' && afterStatus === 'success') {
                // Enhanced payout formula: avg(baseRange) * defenseCount * difficultyMultiplier.
                // Fallback to prior simple heuristic if mission metadata not found.
                const root = globalThis.__LATEST_STORE_STATE__;
                let base = 100;
                let band;
                if (root && root.missions && root.missions.activeMissionId) {
                    const m = root.missions.catalog[root.missions.activeMissionId];
                    if (m) {
                        const [lo, hi] = m.basePayoutRange;
                        base = (lo + hi) / 2;
                        band = m.difficultyBand;
                    }
                }
                const difficultyMultiplier = {
                    [DifficultyBand.EASY]: 1,
                    [DifficultyBand.MID]: 1.4,
                    [DifficultyBand.HARD]: 1.9,
                    [DifficultyBand.ELITE]: 2.5,
                };
                const bandMult = band ? difficultyMultiplier[band] : 1;
                const defenses = state.active.defenses.length || 0;
                state.lastPayout = Math.round(base * defenses * bandMult);
                state.payoutConsumed = false;
            }
        },
        markPayoutConsumed(state) {
            if (state.lastPayout && state.payoutConsumed === false) {
                state.payoutConsumed = true;
            }
        },
        endSession(state) {
            state.active = undefined;
        },
        setTickInterval(state, action) {
            state.tickIntervalMs = action.payload;
        },
    },
});
export const { startSession, queueRun, tickSession, markPayoutConsumed, endSession, setTickInterval, } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
