import { describe, it, expect } from 'vitest';
import { store } from '../src/store/store';
import { setTheme } from '../src/store/uiSlice';

describe('immutability basic test', () => {
  it('returns new reference when theme changes', () => {
    const prev = store.getState().ui;
    store.dispatch(setTheme('light'));
    const next = store.getState().ui;
    expect(next).not.toBe(prev);
    expect(next.theme).toBe('light');
  });
});
