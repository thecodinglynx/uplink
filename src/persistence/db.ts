/* Persistence Layer Abstraction (Step 3)
 * IndexedDB-oriented design with in-memory fallback for tests.
 */
import { createHash } from 'node:crypto';

export const SCHEMA_VERSION = 1; // bump when structure changes

// ---- Types ----
export interface StoredBlob<T> {
  schemaVersion: number;
  checksum: string; // sha256 hex of payload JSON
  length: number; // string length of serialized payload
  timestamp: number; // write time ms
  payload: T;
}

export interface PersistenceAdapter {
  get<T>(store: string, key: string): Promise<StoredBlob<T> | undefined>;
  put<T>(store: string, key: string, value: StoredBlob<T>): Promise<void>;
  delete(store: string, key: string): Promise<void>;
  listKeys(store: string): Promise<string[]>;
}

// ---- In-Memory Adapter (used in tests) ----
class MemoryAdapter implements PersistenceAdapter {
  private stores = new Map<string, Map<string, unknown>>();
  private ensure(store: string) {
    if (!this.stores.has(store)) this.stores.set(store, new Map());
    return this.stores.get(store)!;
  }
  async get<T>(store: string, key: string) {
    return this.ensure(store).get(key) as StoredBlob<T> | undefined;
  }
  async put<T>(store: string, key: string, value: StoredBlob<T>) {
    this.ensure(store).set(key, value);
  }
  async delete(store: string, key: string) {
    this.ensure(store).delete(key);
  }
  async listKeys(store: string) {
    return Array.from(this.ensure(store).keys());
  }
  // test helper to mutate raw memory (simulate corruption)
  corrupt(store: string, key: string, mut: (v: any) => void) {
    const v = this.ensure(store).get(key);
    if (v) {
      mut(v);
    }
  }
}

// For browser environment we can later implement real IndexedDB adapter.
export function createInMemoryAdapter(): MemoryAdapter {
  return new MemoryAdapter();
}

// ---- Checksum Utility ----
export function computeChecksum(serialized: string): string {
  // Node crypto for tests / Node; in browser could use subtle crypto; fallback to simple hash.
  return createHash('sha256').update(serialized).digest('hex');
}

// ---- Core API ----
const PROFILE_STATE_STORE = 'profileState';
const META_STORE = 'meta';

export interface PersistenceOptions {
  adapter?: PersistenceAdapter; // default in-memory
  instrumentation?: {
    onWrite?: (info: { key: string; bytes: number; ms: number }) => void;
    onCorruptionDetected?: (info: { key: string; reason: string }) => void;
    onRecovery?: (info: { key: string; recovered: boolean }) => void;
  };
}

export class Persistence {
  private adapter: PersistenceAdapter;
  private inst?: PersistenceOptions['instrumentation'];
  constructor(opts: PersistenceOptions = {}) {
    this.adapter = opts.adapter ?? createInMemoryAdapter();
    this.inst = opts.instrumentation;
  }

  async init(): Promise<void> {
    // Store schema version in meta if absent
    const existing = await this.adapter.get<{ schemaVersion: number }>(META_STORE, 'schema');
    if (!existing) {
      await this.adapter.put(
        META_STORE,
        'schema',
        this.wrapPayload({ schemaVersion: SCHEMA_VERSION }),
      );
    }
  }

  async getSchemaVersion(): Promise<number> {
    const schema = await this.adapter.get<{ schemaVersion: number }>(META_STORE, 'schema');
    return schema?.payload.schemaVersion ?? SCHEMA_VERSION;
  }

  private wrapPayload<T>(payload: T): StoredBlob<T> {
    const serialized = JSON.stringify(payload);
    return {
      schemaVersion: SCHEMA_VERSION,
      checksum: computeChecksum(serialized),
      length: serialized.length,
      timestamp: Date.now(),
      payload,
    };
  }

  private validateBlob<T>(blob: StoredBlob<T>): boolean {
    const serialized = JSON.stringify(blob.payload);
    if (serialized.length !== blob.length) return false;
    const checksum = computeChecksum(serialized);
    return checksum === blob.checksum;
  }

  private currentKey(profileId: string) {
    return `${profileId}:current`;
  }
  private backupKey(profileId: string) {
    return `${profileId}:backup`;
  }

  async loadProfileState<T>(profileId: string): Promise<T | undefined> {
    const currentKey = this.currentKey(profileId);
    const blob = await this.adapter.get<T>(PROFILE_STATE_STORE, currentKey);
    if (!blob) return undefined;
    if (this.validateBlob(blob)) return blob.payload;
    this.inst?.onCorruptionDetected?.({ key: currentKey, reason: 'checksum_mismatch' });
    // Attempt recovery
    const backup = await this.adapter.get<T>(PROFILE_STATE_STORE, this.backupKey(profileId));
    if (backup && this.validateBlob(backup)) {
      this.inst?.onRecovery?.({ key: currentKey, recovered: true });
      // Promote backup to current
      await this.adapter.put(PROFILE_STATE_STORE, currentKey, backup);
      return backup.payload;
    }
    this.inst?.onRecovery?.({ key: currentKey, recovered: false });
    return undefined;
  }

  async atomicSaveProfileState<T>(profileId: string, state: T): Promise<void> {
    const start = performance.now?.() ?? Date.now();
    const currentKey = this.currentKey(profileId);
    const backupKey = this.backupKey(profileId);
    const existing = await this.adapter.get<T>(PROFILE_STATE_STORE, currentKey);
    if (existing) {
      await this.adapter.put(PROFILE_STATE_STORE, backupKey, existing); // rotate backup
    }
    const wrapped = this.wrapPayload(state);
    await this.adapter.put(PROFILE_STATE_STORE, currentKey, wrapped);
    const ms = (performance.now?.() ?? Date.now()) - start;
    this.inst?.onWrite?.({ key: currentKey, bytes: wrapped.length, ms });
  }

  // Migration runner: takes ordered migrations list; each migration describes from -> to
  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.init();
    let version = await this.getSchemaVersion();
    const ordered = migrations.filter((m) => m.from >= version).sort((a, b) => a.from - b.from);
    for (const m of ordered) {
      if (m.from !== version) continue; // skip non-matching start
      await m.run(this);
      version = m.to;
      // persist new version
      await this.adapter.put(META_STORE, 'schema', this.wrapPayload({ schemaVersion: version }));
    }
  }

  // Expose adapter for test-only operations (e.g., corruption simulation)
  get debugAdapter(): PersistenceAdapter {
    return this.adapter;
  }
}

// ---- Migration Support ----
export interface Migration {
  from: number;
  to: number;
  run(persistence: Persistence): Promise<void>;
}

// Initial migration is effectively handled by init() writing schema record; provided here for completeness.
export const initialMigration: Migration = {
  from: 1,
  to: 1,
  async run() {
    // no-op; initial schema baseline
  },
};
