import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { sessionReducer, startSession, queueRun, tickSession } from '../src/store/sessionSlice';
import { ledgerReducer } from '../src/store/ledgerSlice';
import { payoutMiddleware } from '../src/store/middleware/payout';

// Minimal combined reducer for test
const makeStore = () =>
  configureStore({
    reducer: { session: sessionReducer, ledger: ledgerReducer },
    middleware: (g) => g().concat(payoutMiddleware),
  });

describe('session payout integration', () => {
  it('awards credits on success', () => {
    const store = makeStore();
    store.dispatch(startSession({ missionId: 'mX' as any, seed: 7 }));
    const defenses = store.getState().session.active!.defenses;
    defenses.forEach((d) => store.dispatch(queueRun({ defenseId: d.id, toolId: 'generic_tool' })));
    // Force all defenses to bypass quickly by ticking far future multiple times
    for (let i = 0; i < 10; i++) {
      store.dispatch(tickSession({ now: Date.now() + 10000 + i * 1000 }));
    }
    const credits = store.getState().ledger.profile.credits;
    expect(credits).toBeGreaterThan(0);
  });
});
