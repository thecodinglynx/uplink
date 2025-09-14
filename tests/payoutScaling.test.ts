import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer, startSession, queueRun, tickSession } from '../src/store/sessionSlice';
import { ledgerReducer } from '../src/store/ledgerSlice';
import { missionsReducer, hydrateMissions, setActiveMission } from '../src/store/missionsSlice';
import { payoutMiddleware } from '../src/store/middleware/payout';
import { DifficultyBand } from '../src/domain/types';

function makeMission(id: string, band: DifficultyBand, avg: number) {
  const variance = Math.round(avg * 0.2);
  return {
    id: id as any,
    title: id,
    type: 'procedural',
    factions: [],
    difficultyBand: band,
    basePayoutRange: [avg - variance, avg + variance],
    objectives: [{ id: `obj_${id}` as any, type: 'exfiltrate', targetCount: 1 }],
    defenseTemplate: [{ archetype: 'FIREWALL' as any, minTier: 1, maxTier: 1 }],
    seedMode: 'FIXED',
    version: 1,
  } as any;
}

describe('payout scaling', () => {
  const bands = [DifficultyBand.EASY, DifficultyBand.MID, DifficultyBand.HARD];
  it('higher difficulty yields higher payout', () => {
    const store = configureStore({
      reducer: { session: sessionReducer, ledger: ledgerReducer, missions: missionsReducer },
      middleware: (gDM) => gDM().concat(payoutMiddleware),
    });
    // expose state for session payout formula
    (globalThis as any).__LATEST_STORE_STATE__ = store.getState();
    store.subscribe(() => ((globalThis as any).__LATEST_STORE_STATE__ = store.getState()));

    const missions = bands.map((b, idx) => makeMission(`m_${idx}`, b, 200 + idx * 100));
    store.dispatch(hydrateMissions(missions));

    const payouts: number[] = [];
    for (let i = 0; i < missions.length; i++) {
      const m = missions[i];
      store.dispatch(setActiveMission(m.id));
      store.dispatch(startSession({ missionId: m.id, seed: 1234 + i }));
      const state = store.getState();
      const defenses = state.session.active!.defenses.map((d) => d.id);
      for (const defId of defenses) {
        store.dispatch(queueRun({ defenseId: defId, toolId: 'SCANNER_TOOL' }));
      }
      // tick forward in 1s increments until session finishes
      for (let t = 0; t < 60; t++) {
        store.dispatch(tickSession({ now: Date.now() + t * 1000 }));
        const s2 = store.getState().session.active;
        if (s2 && s2.status === 'success') break;
      }
      payouts.push(store.getState().session.lastPayout || 0);
    }
    expect(payouts.length).toBe(3);
    expect(payouts[0]).toBeGreaterThan(0);
    expect(payouts[1]).toBeGreaterThan(payouts[0]);
    expect(payouts[2]).toBeGreaterThan(payouts[1]);
  });
});
