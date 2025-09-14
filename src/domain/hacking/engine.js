import { generateDefenseInstances } from '@domain/defense/ordering';
import { updateTrace } from './trace';
import { applyAdaptive } from './adaptive';
let defenseCounter = 0;
let toolRunCounter = 0;
function makeDefenseId() {
    defenseCounter += 1;
    return `def_${defenseCounter}`;
}
function makeToolRunId() {
    toolRunCounter += 1;
    return `tr_${toolRunCounter}`;
}
// Minimal RNG (mulberry32) for deterministic ordering / future shuffle use
export function createSeededRng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function createSession(missionId, seed, now, opts) {
    const rng = createSeededRng(seed);
    let defenses = [];
    if (opts.template && opts.template.length) {
        defenses = generateDefenseInstances(opts.template, { seed, now });
    }
    else if (opts.defenseCount) {
        for (let i = 0; i < opts.defenseCount; i++) {
            defenses.push({
                id: makeDefenseId(),
                archetype: 'FIREWALL',
                tier: 1 + Math.floor(rng() * 2),
                adaptiveApplied: false,
                currentProgress: 0,
                status: 'pending',
                noiseEvents: [],
            });
        }
    }
    return {
        id: `sess_${missionId}_${Date.now()}`,
        missionId,
        defenses,
        toolRuns: [],
        trace: { current: 0, max: 100, baseRate: 1, dynamicRateModifiers: [] },
        logs: [],
        startTimestamp: now,
        seed,
        status: 'active',
        lastTick: now,
    };
}
function activeRunCount(session) {
    return session.toolRuns.filter((r) => r.startTime > 0 && !r.canceled && r.progress < 1).length;
}
export function queueToolRun(session, toolId, defenseId, now, durationMs, concurrencyLimit) {
    const defense = session.defenses.find((d) => d.id === defenseId);
    if (!defense)
        throw new Error('Defense not found');
    const run = {
        id: makeToolRunId(),
        toolId: toolId,
        targetDefenseId: defenseId,
        startTime: 0, // 0 indicates queued
        eta: 0,
        progress: 0,
        canceled: false,
        durationMs,
    };
    session.toolRuns.push(run);
    // Try to start immediately if slot free
    if (activeRunCount(session) < concurrencyLimit) {
        startRun(run, now);
    }
    return run.id;
}
function startRun(run, now) {
    run.startTime = now;
    run.eta = now + run.durationMs;
    run.progress = 0;
}
export function cancelToolRun(session, runId) {
    const run = session.toolRuns.find((r) => r.id === runId);
    if (!run)
        return false;
    if (run.progress >= 1)
        return false; // cannot cancel completed
    run.canceled = true;
    return true;
}
function promoteQueued(session, now, concurrencyLimit) {
    const current = activeRunCount(session);
    const available = concurrencyLimit - current;
    if (available <= 0)
        return;
    const queued = session.toolRuns.filter((r) => r.durationMs !== undefined && r.startTime === 0 && !r.canceled);
    for (let i = 0; i < available && i < queued.length; i++) {
        startRun(queued[i], now);
    }
}
export function updateSession(session, now, concurrencyLimit) {
    if (session.status !== 'active')
        return; // no-op if already ended
    // progress active runs
    for (const run of session.toolRuns) {
        if (run.canceled || run.startTime === 0 || run.progress >= 1)
            continue;
        const total = run.eta - run.startTime;
        if (total <= 0) {
            run.progress = 1;
        }
        else {
            run.progress = Math.min(1, (now - run.startTime) / total);
        }
        if (run.progress >= 1) {
            // mark defense bypassed
            const defense = session.defenses.find((d) => d.id === run.targetDefenseId);
            if (defense && defense.status !== 'bypassed') {
                defense.status = 'bypassed';
                defense.currentProgress = 1;
            }
        }
        else {
            const defense = session.defenses.find((d) => d.id === run.targetDefenseId);
            if (defense && defense.status === 'pending')
                defense.status = 'active';
            if (defense)
                defense.currentProgress = run.progress;
        }
    }
    // free capacity from canceled runs (not already progressed)
    promoteQueued(session, now, concurrencyLimit);
    // trace & adaptive
    updateTrace(session, now);
    applyAdaptive(session);
    session.lastTick = now;
    // Determine terminal states
    if (session.trace.current >= session.trace.max) {
        session.status = 'failed';
    }
    else if (session.defenses.every((d) => d.status === 'bypassed')) {
        session.status = 'success';
    }
}
export function sessionActiveRuns(session) {
    return session.toolRuns
        .filter((r) => r.startTime > 0 && !r.canceled && r.progress < 1)
        .map((r) => r.id);
}
