import { generateDefenseInstances } from '../domain/defense/ordering';
export function runBalanceSimulation(opts) {
    const payoutScale = opts.payoutScale ?? 100;
    let totalDefs = 0;
    let violations = 0;
    const tierFrequency = {};
    const seedSignatures = {};
    const payouts = [];
    let traceFailures = 0;
    for (const seed of opts.seeds) {
        const defenses = generateDefenseInstances(opts.template, { seed, now: Date.now() });
        totalDefs += defenses.length;
        let run = 0;
        let lastHigh = false;
        let difficultyScore = 0; // aggregate heuristic
        for (const d of defenses) {
            if (!tierFrequency[d.tier])
                tierFrequency[d.tier] = 0;
            tierFrequency[d.tier] += 1;
            const high = !!d.highNoise;
            if (high) {
                run = lastHigh ? run + 1 : 1;
                if (run > 2)
                    violations += 1;
                difficultyScore += (d.tier + 1) * 1.4;
            }
            else
                run = 0;
            lastHigh = high;
            difficultyScore += (d.tier + 1) * 0.9;
        }
        seedSignatures[String(seed)] = defenses.map((d) => `${d.archetype}:${d.tier}`).join('|');
        // Derive payout: nonlinear diminishing returns
        const payout = Math.round(payoutScale * Math.log(1 + difficultyScore));
        payouts.push(payout);
        // Heuristic trace failure chance: sigmoid on difficulty vs threshold
        const failureProb = 1 / (1 + Math.exp(-(difficultyScore - 12) / 4));
        if (failureProb > 0.5)
            traceFailures += 1; // count as failure if surpass threshold; coarse measure
    }
    payouts.sort((a, b) => a - b);
    const avgPayout = payouts.reduce((a, b) => a + b, 0) / payouts.length;
    const medianPayout = payouts.length % 2
        ? payouts[(payouts.length - 1) / 2]
        : (payouts[payouts.length / 2 - 1] + payouts[payouts.length / 2]) / 2;
    const mean = avgPayout;
    const variance = payouts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / payouts.length;
    const stdDevPayout = Math.sqrt(variance);
    const pct = (p) => {
        if (!payouts.length)
            return 0;
        const idx = (payouts.length - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        if (lo === hi)
            return payouts[lo];
        const w = idx - lo;
        return payouts[lo] * (1 - w) + payouts[hi] * w;
    };
    const q10 = pct(0.1);
    const q25 = pct(0.25);
    const q75 = pct(0.75);
    const q90 = pct(0.9);
    const lowCut = q25;
    const highCut = q75;
    let lowCount = 0, midCount = 0, highCount = 0;
    for (const p of payouts) {
        if (p <= lowCut)
            lowCount++;
        else if (p >= highCut)
            highCount++;
        else
            midCount++;
    }
    return {
        totalRuns: opts.seeds.length,
        avgDefenseCount: totalDefs / opts.seeds.length,
        highNoiseAdjacencyViolations: violations,
        tierFrequency,
        seedSignatures,
        avgPayout,
        medianPayout,
        stdDevPayout,
        traceFailureRate: traceFailures / opts.seeds.length,
        payoutQuantiles: { q10, q25, q75, q90 },
        payoutBuckets: {
            low: lowCount / payouts.length,
            mid: midCount / payouts.length,
            high: highCount / payouts.length,
        },
    };
}
