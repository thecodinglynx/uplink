import { describe, it, expect } from 'vitest';
import { store } from '../src/store/store';
describe('store initial state', () => {
    it('matches expected shape snapshot', () => {
        const state = store.getState();
        expect(state).toMatchObject({
            profiles: { entities: {}, authStatus: 'idle' },
            missions: { catalog: {}, filters: {} },
            ui: { theme: 'dark', layoutDirty: false },
        });
    });
});
