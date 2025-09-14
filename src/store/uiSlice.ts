import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  theme: 'dark' | 'light';
  layoutDirty: boolean;
}

const initialState: UIState = {
  theme: 'dark',
  layoutDirty: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'dark' | 'light'>) {
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
