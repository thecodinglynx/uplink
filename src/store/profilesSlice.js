import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    entities: {},
    authStatus: 'idle',
};
const profilesSlice = createSlice({
    name: 'profiles',
    initialState,
    reducers: {
        setActiveProfile(state, action) {
            state.activeProfileId = action.payload;
        },
        upsertProfile(state, action) {
            state.entities[action.payload.id] = action.payload;
        },
    },
});
export const { setActiveProfile, upsertProfile } = profilesSlice.actions;
export const profilesReducer = profilesSlice.reducer;
