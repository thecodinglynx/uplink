import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    catalog: {},
    filters: {},
};
const missionsSlice = createSlice({
    name: 'missions',
    initialState,
    reducers: {
        hydrateMissions(state, action) {
            for (const m of action.payload)
                state.catalog[m.id] = m;
        },
        setActiveMission(state, action) {
            state.activeMissionId = action.payload;
        },
        setMissionFilters(state, action) {
            state.filters = action.payload;
        },
    },
});
export const { hydrateMissions, setActiveMission, setMissionFilters } = missionsSlice.actions;
export const missionsReducer = missionsSlice.reducer;
