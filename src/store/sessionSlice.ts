import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HackingSessionInstance, MissionId, DefenseId } from '../domain/types';
import { DifficultyBand } from '../domain/types';
import type { RootState } from './store';
import { createSession, queueToolRun, updateSession } from '../domain/hacking/engine';

export interface SessionState {
  active?: HackingSessionInstance;
  tickIntervalMs: number;
  concurrencyLimit: number;
  lastPayout?: number;
  payoutConsumed?: boolean; // middleware processed
}

const initialState: SessionState = {
  tickIntervalMs: 500,
  concurrencyLimit: 2,
};

interface StartSessionPayload {
  missionId: MissionId;
  seed: number;
}
interface QueueRunPayload {
  defenseId: DefenseId;
  toolId: string;
}
interface TickPayload {
  now: number;
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<StartSessionPayload>) {
      const { missionId, seed } = action.payload;
      state.active = createSession(missionId, seed, Date.now(), { defenseCount: 5 });
    },
    queueRun(state, action: PayloadAction<QueueRunPayload>) {
      if (!state.active) return;
      queueToolRun(
        state.active,
        action.payload.toolId,
        action.payload.defenseId,
        Date.now(),
        3000,
        state.concurrencyLimit,
      );
    },
    tickSession(state, action: PayloadAction<TickPayload>) {
      if (!state.active) return;
      const beforeStatus = state.active.status;
      updateSession(state.active, action.payload.now, state.concurrencyLimit);
      const afterStatus = state.active.status;
      if (beforeStatus === 'active' && afterStatus === 'success') {
        // Enhanced payout formula: avg(baseRange) * defenseCount * difficultyMultiplier.
        // Fallback to prior simple heuristic if mission metadata not found.
        const root = (globalThis as any).__LATEST_STORE_STATE__ as RootState | undefined;
        let base = 100;
        let band: DifficultyBand | undefined;
        if (root && root.missions && root.missions.activeMissionId) {
          const m = root.missions.catalog[root.missions.activeMissionId];
          if (m) {
            const [lo, hi] = m.basePayoutRange;
            base = (lo + hi) / 2;
            band = m.difficultyBand;
          }
        }
        const difficultyMultiplier: Record<DifficultyBand, number> = {
          [DifficultyBand.EASY]: 1,
          [DifficultyBand.MID]: 1.4,
          [DifficultyBand.HARD]: 1.9,
          [DifficultyBand.ELITE]: 2.5,
        } as const;
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
    setTickInterval(state, action: PayloadAction<number>) {
      state.tickIntervalMs = action.payload;
    },
  },
});

export const {
  startSession,
  queueRun,
  tickSession,
  markPayoutConsumed,
  endSession,
  setTickInterval,
} = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
