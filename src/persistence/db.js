/* Persistence Layer Abstraction (Step 3)
 * IndexedDB-oriented design with in-memory fallback for tests.
 */
// Environment-adaptive SHA-256 hashing.
// Avoid direct dependency on node:crypto so browser bundles succeed.
// We try (in order): Web Crypto (crypto.subtle), Node crypto (if available via dynamic require),
// and finally a lightweight JS fallback (not cryptographically strong but adequate for corruption detection).
// The API remains synchronous for existing call sites by memoizing async digests where possible; since
// corruption detection is non-performance critical we use a cached async->sync bridging strategy.
let _nodeCreateHash = null;
// Attempt dynamic Node require inside try/catch so Vite can tree-shake / ignore in browser.
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    if (nodeCrypto?.createHash) {
        _nodeCreateHash = nodeCrypto.createHash;
    }
}
catch (_) {
    // ignore – running in browser
}
async function sha256Web(data) {
    const enc = new TextEncoder();
    const buf = enc.encode(data);
    const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', buf);
    const arr = Array.from(new Uint8Array(hashBuf));
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
function sha256Fallback(data) {
    // FNV-1a 32-bit adapted & extended to 64-bit hex by mixing.
    let h1 = 0x811c9dc5;
    let h2 = 0x811c9dc5;
    for (let i = 0; i < data.length; i++) {
        const c = data.charCodeAt(i);
        h1 ^= c;
        h1 = (h1 * 0x01000193) >>> 0;
        h2 ^= c << i % 24;
        h2 = (h2 * 0x01000197) >>> 0;
    }
    const combined = (BigInt(h1) << 32n) ^ BigInt(h2);
    return combined.toString(16).padStart(16, '0');
}
// Simple cache to store promise resolutions for identical inputs (profiles small strings) to keep interface sync-like.
const asyncCache = new Map();
export function computeChecksum(serialized) {
    // Fast path: Node runtime available.
    if (_nodeCreateHash) {
        return _nodeCreateHash('sha256').update(serialized).digest('hex');
    }
    // Browser with subtle crypto.
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        // Kick off async computation if not cached yet; return fallback meanwhile then replace on next call.
        if (!asyncCache.has(serialized)) {
            sha256Web(serialized)
                .then((h) => asyncCache.set(serialized, h))
                .catch(() => { });
            // Provide deterministic placeholder until real hash arrives; use fallback hash.
            const fallback = sha256Fallback(serialized);
            asyncCache.set(serialized, fallback);
            return fallback;
        }
        return asyncCache.get(serialized);
    }
    // Pure JS fallback.
    return sha256Fallback(serialized);
}
export const SCHEMA_VERSION = 1; // bump when structure changes
// ---- In-Memory Adapter (used in tests) ----
class MemoryAdapter {
    stores = new Map();
    ensure(store) {
        if (!this.stores.has(store))
            this.stores.set(store, new Map());
        return this.stores.get(store);
    }
    async get(store, key) {
        return this.ensure(store).get(key);
    }
    async put(store, key, value) {
        this.ensure(store).set(key, value);
    }
    async delete(store, key) {
        this.ensure(store).delete(key);
    }
    async listKeys(store) {
        return Array.from(this.ensure(store).keys());
    }
    // test helper to mutate raw memory (simulate corruption)
    corrupt(store, key, mut) {
        const v = this.ensure(store).get(key);
        if (v) {
            mut(v);
        }
    }
}
// For browser environment we can later implement real IndexedDB adapter.
export function createInMemoryAdapter() {
    return new MemoryAdapter();
}
// (Original computeChecksum replaced above with adaptive implementation.)
// ---- Core API ----
const PROFILE_STATE_STORE = 'profileState';
const META_STORE = 'meta';
export class Persistence {
    adapter;
    inst;
    constructor(opts = {}) {
        this.adapter = opts.adapter ?? createInMemoryAdapter();
        this.inst = opts.instrumentation;
    }
    async init() {
        // Store schema version in meta if absent
        const existing = await this.adapter.get(META_STORE, 'schema');
        if (!existing) {
            await this.adapter.put(META_STORE, 'schema', this.wrapPayload({ schemaVersion: SCHEMA_VERSION }));
        }
    }
    async getSchemaVersion() {
        const schema = await this.adapter.get(META_STORE, 'schema');
        return schema?.payload.schemaVersion ?? SCHEMA_VERSION;
    }
    wrapPayload(payload) {
        const serialized = JSON.stringify(payload);
        return {
            schemaVersion: SCHEMA_VERSION,
            checksum: computeChecksum(serialized),
            length: serialized.length,
            timestamp: Date.now(),
            payload,
        };
    }
    validateBlob(blob) {
        const serialized = JSON.stringify(blob.payload);
        if (serialized.length !== blob.length)
            return false;
        const checksum = computeChecksum(serialized);
        return checksum === blob.checksum;
    }
    currentKey(profileId) {
        return `${profileId}:current`;
    }
    backupKey(profileId) {
        return `${profileId}:backup`;
    }
    async loadProfileState(profileId) {
        const currentKey = this.currentKey(profileId);
        const blob = await this.adapter.get(PROFILE_STATE_STORE, currentKey);
        if (!blob)
            return undefined;
        if (this.validateBlob(blob))
            return blob.payload;
        this.inst?.onCorruptionDetected?.({ key: currentKey, reason: 'checksum_mismatch' });
        // Attempt recovery
        const backup = await this.adapter.get(PROFILE_STATE_STORE, this.backupKey(profileId));
        if (backup && this.validateBlob(backup)) {
            this.inst?.onRecovery?.({ key: currentKey, recovered: true });
            // Promote backup to current
            await this.adapter.put(PROFILE_STATE_STORE, currentKey, backup);
            return backup.payload;
        }
        this.inst?.onRecovery?.({ key: currentKey, recovered: false });
        return undefined;
    }
    async atomicSaveProfileState(profileId, state) {
        const start = performance.now?.() ?? Date.now();
        const currentKey = this.currentKey(profileId);
        const backupKey = this.backupKey(profileId);
        const existing = await this.adapter.get(PROFILE_STATE_STORE, currentKey);
        if (existing) {
            await this.adapter.put(PROFILE_STATE_STORE, backupKey, existing); // rotate backup
        }
        const wrapped = this.wrapPayload(state);
        await this.adapter.put(PROFILE_STATE_STORE, currentKey, wrapped);
        const ms = (performance.now?.() ?? Date.now()) - start;
        this.inst?.onWrite?.({ key: currentKey, bytes: wrapped.length, ms });
    }
    // Migration runner: takes ordered migrations list; each migration describes from -> to
    async runMigrations(migrations) {
        await this.init();
        let version = await this.getSchemaVersion();
        const ordered = migrations.filter((m) => m.from >= version).sort((a, b) => a.from - b.from);
        for (const m of ordered) {
            if (m.from !== version)
                continue; // skip non-matching start
            await m.run(this);
            version = m.to;
            // persist new version
            await this.adapter.put(META_STORE, 'schema', this.wrapPayload({ schemaVersion: version }));
        }
    }
    // Expose adapter for test-only operations (e.g., corruption simulation)
    get debugAdapter() {
        return this.adapter;
    }
}
// Initial migration is effectively handled by init() writing schema record; provided here for completeness.
export const initialMigration = {
    from: 1,
    to: 1,
    async run() {
        // no-op; initial schema baseline
    },
};
