let defenseCounter = 0;
function makeDefenseId() {
    defenseCounter += 1;
    return `def_${defenseCounter}`;
}
// Simple seeded RNG (mulberry32) duplicated locally to avoid cross import cycles
function createSeededRng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function shuffleWithConstraint(arr, isHigh, maxAdj = 2, rng) {
    const copy = arr.slice();
    const attempt = () => {
        // Fisher-Yates
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        // validate
        let run = 0;
        let lastHigh = false;
        for (const c of copy) {
            const h = isHigh(c);
            if (h) {
                run = lastHigh ? run + 1 : 1;
                if (run > maxAdj)
                    return false;
            }
            else {
                run = 0;
            }
            lastHigh = h;
        }
        return true;
    };
    for (let tries = 0; tries < 50; tries++) {
        if (attempt())
            return copy.slice();
    }
    // Greedy fix if still failing
    const fixed = [];
    for (const item of copy) {
        fixed.push(item);
        let run = 0;
        let lastHigh = false;
        let invalid = false;
        for (const f of fixed) {
            const h = isHigh(f);
            if (h) {
                run = lastHigh ? run + 1 : 1;
                if (run > maxAdj) {
                    invalid = true;
                    break;
                }
            }
            else
                run = 0;
            lastHigh = h;
        }
        if (invalid) {
            // move item later to first position where valid
            fixed.pop();
            for (let pos = fixed.length; pos <= fixed.length; pos++) {
                // append
                const trial = fixed.slice();
                trial.push(item);
                let r = 0;
                let lH = false;
                let bad = false;
                for (const t of trial) {
                    const h = isHigh(t);
                    if (h) {
                        r = lH ? r + 1 : 1;
                        if (r > maxAdj) {
                            bad = true;
                            break;
                        }
                    }
                    else
                        r = 0;
                    lH = h;
                }
                if (!bad) {
                    fixed.push(item);
                    break;
                }
            }
        }
    }
    return fixed;
}
export function generateDefenseInstances(template, opts) {
    const rng = createSeededRng(opts.seed);
    const ordered = shuffleWithConstraint(template, (t) => !!t.highNoise, 2, rng);
    return ordered.map((slot) => {
        const tierRange = slot.maxTier - slot.minTier + 1;
        const tier = slot.minTier + Math.floor(rng() * tierRange);
        return {
            id: makeDefenseId(),
            archetype: slot.archetype,
            tier,
            adaptiveApplied: false,
            currentProgress: 0,
            status: 'pending',
            noiseEvents: [],
            highNoise: !!slot.highNoise,
        };
    });
}
