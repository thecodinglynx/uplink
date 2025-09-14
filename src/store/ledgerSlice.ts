import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createLedger, earnCredits } from '../domain/economy/ledger';
import type { ProfileDefinition } from '../domain/types';

export interface LedgerReduxState {
  ledger: ReturnType<typeof createLedger>;
  profile: ProfileDefinition; // simplified single profile context
}

const initialState: LedgerReduxState = {
  ledger: createLedger(),
  profile: {
    id: 'prof_1' as any,
    name: 'Operator',
    credits: 0,
    factionReputations: [],
  } as any,
};

interface EarnPayload {
  amount: number;
  reason: string;
  now?: number;
}

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    earn(state, action: PayloadAction<EarnPayload>) {
      const { amount, reason } = action.payload;
      const { profile, ledger } = earnCredits(state.profile, state.ledger, amount, {
        reason,
        now: action.payload.now ?? Date.now(),
      });
      state.profile = profile;
      state.ledger = ledger;
    },
  },
});

export const { earn } = ledgerSlice.actions;
export const ledgerReducer = ledgerSlice.reducer;
