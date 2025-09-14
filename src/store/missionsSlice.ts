import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MissionDefinition, MissionId } from '@domain/types';

export interface MissionsState {
  catalog: Record<string, MissionDefinition>;
  activeMissionId?: MissionId;
  filters: { difficulty?: string; faction?: string };
}

const initialState: MissionsState = {
  catalog: {},
  filters: {}
};

const missionsSlice = createSlice({
  name: 'missions',
  initialState,
  reducers: {
    hydrateMissions(state, action: PayloadAction<MissionDefinition[]>) {
      for (const m of action.payload) state.catalog[m.id] = m;
    },
    setActiveMission(state, action: PayloadAction<MissionId | undefined>) {
      state.activeMissionId = action.payload;
    },
    setMissionFilters(state, action: PayloadAction<MissionsState['filters']>) {
      state.filters = action.payload;
    }
  }
});

export const { hydrateMissions, setActiveMission, setMissionFilters } = missionsSlice.actions;
export const missionsReducer = missionsSlice.reducer;
