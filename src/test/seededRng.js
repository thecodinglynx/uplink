export function createRng(seed) {
    // Ensure 32-bit unsigned
    let state = seed >>> 0;
    function raw() {
        // Mulberry32 algorithm
        state |= 0; // force int
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0,1)
    }
    return {
        seed: state,
        next: raw,
        int(maxExclusive) {
            if (maxExclusive <= 0)
                throw new Error('maxExclusive must be > 0');
            return Math.floor(raw() * maxExclusive);
        },
        clone() {
            return createRng(state);
        },
    };
}
