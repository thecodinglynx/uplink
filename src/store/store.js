import { configureStore } from '@reduxjs/toolkit';
import { Persistence, createInMemoryAdapter } from '../persistence/db';
import { recordPersistenceWrite } from '../instrumentation/perf';
import { profilesReducer } from './profilesSlice';
import { missionsReducer } from './missionsSlice';
import { uiReducer } from './uiSlice';
import { sessionReducer } from './sessionSlice';
import { ledgerReducer } from './ledgerSlice';
import { payoutMiddleware } from './middleware/payout';
// Placeholder middleware array for future domain event bus / autosave.
// Autosave middleware (debounced)
const persistence = new Persistence({
    adapter: createInMemoryAdapter(),
    instrumentation: {
        onWrite: ({ bytes, ms }) => recordPersistenceWrite({ bytes, ms }),
    },
});
void persistence.init();
let autosaveTimer = null;
const AUTOSAVE_DEBOUNCE_MS = 500;
const AUTOSAVE_PROFILE_ID_SELECTOR = (state) => state.profiles?.activeProfileId;
const autosaveMiddleware = (storeAPI) => (next) => (action) => {
    const result = next(action);
    const typesTrigger = [
        'missions/missionCompleted',
        'upgrades/hardwarePurchased',
        'upgrades/toolVersionPurchased',
        'factions/reputationAdjusted',
        'narrative/nodeChosen',
    ];
    if (typesTrigger.includes(action.type)) {
        if (autosaveTimer)
            clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(async () => {
            const state = storeAPI.getState();
            const profileId = AUTOSAVE_PROFILE_ID_SELECTOR(state);
            if (!profileId)
                return;
            // For now save entire state object under profileId
            await persistence.atomicSaveProfileState(profileId, state);
        }, AUTOSAVE_DEBOUNCE_MS);
    }
    return result;
};
// payoutMiddleware imported
export const store = configureStore({
    reducer: {
        profiles: profilesReducer,
        missions: missionsReducer,
        ui: uiReducer,
        session: sessionReducer,
        ledger: ledgerReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: true, immutableCheck: true }).concat(autosaveMiddleware, payoutMiddleware),
});
