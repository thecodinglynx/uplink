import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    theme: 'dark',
    layoutDirty: false,
};
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setTheme(state, action) {
            state.theme = action.payload;
        },
        markLayoutDirty(state) {
            state.layoutDirty = true;
        },
        clearLayoutDirty(state) {
            state.layoutDirty = false;
        },
    },
});
export const { setTheme, markLayoutDirty, clearLayoutDirty } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
