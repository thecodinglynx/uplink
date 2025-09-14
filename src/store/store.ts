import { configureStore } from '@reduxjs/toolkit';
import { profilesReducer } from './profilesSlice';
import { missionsReducer } from './missionsSlice';
import { uiReducer } from './uiSlice';

// Placeholder middleware array for future domain event bus / autosave.
export const store = configureStore({
  reducer: {
    profiles: profilesReducer,
    missions: missionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: true, immutableCheck: true }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
