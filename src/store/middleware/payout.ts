import { earn } from '../ledgerSlice';
import { adjustReputation } from '../../domain/factions/reputation';
import { markPayoutConsumed } from '../sessionSlice';

export const payoutMiddleware = (storeAPI: any) => (next: any) => (action: any) => {
  const prev = storeAPI.getState();
  const result = next(action);
  if (action.type === 'session/tickSession') {
    const state = storeAPI.getState();
    const prevSession = prev.session?.active;
    const curSession = state.session?.active;
    if (
      prevSession &&
      curSession &&
      prevSession.status === 'active' &&
      curSession.status === 'success'
    ) {
      const payout = state.session.lastPayout || 0;
      if (payout > 0 && state.session.payoutConsumed !== true) {
        storeAPI.dispatch(earn({ amount: payout, reason: 'mission_success' }));
        storeAPI.dispatch(markPayoutConsumed());
        // future extensibility: iterate over bonus payout reasons if added to session state
        if (state.profiles && state.profiles.activeProfileId) {
          const profile = state.profiles.profiles[state.profiles.activeProfileId];
          if (profile && state.profiles.factionDefs && state.profiles.factionDefs.length) {
            const faction = state.profiles.factionDefs[0];
            try {
              adjustReputation(
                profile,
                state.profiles.factionDefs,
                faction.id,
                1,
                Date.now(),
                'mission_success',
              );
            } catch {}
          }
        }
      }
    }
  }
  return result;
};
