import { describe, it, expect } from 'vitest';
import {
  Persistence,
  createInMemoryAdapter,
  SCHEMA_VERSION,
  Migration,
} from '../src/persistence/db';

interface TestProfileState {
  credits: number;
  tools: string[];
}

function createPersistence() {
  return new Persistence({ adapter: createInMemoryAdapter() });
}

describe('persistence write/read cycle', () => {
  it('saves and loads profile state with checksum', async () => {
    const p = createPersistence();
    await p.init();
    const state: TestProfileState = { credits: 100, tools: ['scanner'] };
    await p.atomicSaveProfileState('profileA', state);
    const loaded = await p.loadProfileState<TestProfileState>('profileA');
    expect(loaded).toEqual(state);
  });
});

describe('corruption recovery', () => {
  it('recovers from backup when current corrupted', async () => {
    const p = createPersistence();
    await p.init();
    const state1: TestProfileState = { credits: 50, tools: [] };
    await p.atomicSaveProfileState('p1', state1);
    const state2: TestProfileState = { credits: 75, tools: ['cracker'] };
    await p.atomicSaveProfileState('p1', state2);

    // Corrupt current
    const adapter: any = p.debugAdapter as any; // memory adapter
    if (adapter.corrupt) {
      adapter.corrupt('profileState', 'p1:current', (v: any) => {
        v.checksum = 'deadbeef';
      });
    }

    const recovered = await p.loadProfileState<TestProfileState>('p1');
    // Should match last valid backup (state2 before corruption saved backup of previous? We save backup of existing before writing new current.)
    // Flow: save state1 => current=state1; save state2 => backup=state1, current=state2; corrupt current => recovery returns state2? Actually backup=state1 (current valid pre corruption). So recovery returns backup state1.
    expect(recovered).toEqual(state1);
  });
});

describe('migration path', () => {
  it('applies sequential migrations to reach target version', async () => {
    const p = createPersistence();
    await p.init();
    const migrations: Migration[] = [
      {
        from: SCHEMA_VERSION,
        to: SCHEMA_VERSION + 1,
        async run(persist) {
          // Example: no structural change, placeholder
          await persist.atomicSaveProfileState('__migration_marker__', { done: true });
        },
      },
    ];
    await p.runMigrations(migrations);
    const newVersion = await p.getSchemaVersion();
    expect(newVersion).toBe(SCHEMA_VERSION + 1);
  });
});
