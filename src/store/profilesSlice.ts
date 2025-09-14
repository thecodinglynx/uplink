import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProfileDefinition, ProfileId } from '@domain/types';

export interface ProfilesState {
  entities: Record<string, ProfileDefinition>;
  activeProfileId?: ProfileId;
  authStatus: 'idle' | 'authenticated' | 'error';
}

const initialState: ProfilesState = {
  entities: {},
  authStatus: 'idle',
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setActiveProfile(state, action: PayloadAction<ProfileId | undefined>) {
      state.activeProfileId = action.payload;
    },
    upsertProfile(state, action: PayloadAction<ProfileDefinition>) {
      state.entities[action.payload.id] = action.payload;
    },
  },
});

export const { setActiveProfile, upsertProfile } = profilesSlice.actions;
export const profilesReducer = profilesSlice.reducer;
