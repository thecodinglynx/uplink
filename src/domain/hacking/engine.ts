import type {
  HackingSessionInstance,
  MissionId,
  DefenseLayerInstance,
  DefenseId,
  ToolRunInstance,
  ToolRunId,
} from '@domain/types';

// Internal extended tool run with duration tracking
interface EngineToolRun extends ToolRunInstance {
  durationMs: number; // total planned duration
}

let defenseCounter = 0;
let toolRunCounter = 0;

function makeDefenseId(): DefenseId {
  defenseCounter += 1;
  return (`def_${defenseCounter}`) as DefenseId;
}

function makeToolRunId(): ToolRunId {
  toolRunCounter += 1;
  return (`tr_${toolRunCounter}`) as ToolRunId;
}

// Minimal RNG (mulberry32) for deterministic ordering / future shuffle use
export function createSeededRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CreateSessionOptions {
  defenseCount: number; // simple placeholder (later derived from mission template)
}

export function createSession(
  missionId: MissionId,
  seed: number,
  now: number,
  opts: CreateSessionOptions,
): HackingSessionInstance {
  const rng = createSeededRng(seed);
  const defenses: DefenseLayerInstance[] = [];
  for (let i = 0; i < opts.defenseCount; i++) {
    defenses.push({
      id: makeDefenseId(),
      archetype: 'FIREWALL' as any, // placeholder archetype until archetype system step
      tier: 1 + Math.floor(rng() * 2),
      adaptiveApplied: false,
      currentProgress: 0,
      status: 'pending',
      noiseEvents: [],
    });
  }
  return {
    id: (`sess_${missionId}_${Date.now()}`) as any,
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

function activeRunCount(session: HackingSessionInstance): number {
  return session.toolRuns.filter(
    (r) => r.startTime > 0 && !r.canceled && r.progress < 1,
  ).length;
}

export function queueToolRun(
  session: HackingSessionInstance,
  toolId: string,
  defenseId: DefenseId,
  now: number,
  durationMs: number,
  concurrencyLimit: number,
): ToolRunId {
  const defense = session.defenses.find((d) => d.id === defenseId);
  if (!defense) throw new Error('Defense not found');
  const run: EngineToolRun = {
    id: makeToolRunId(),
    toolId: toolId as any,
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

function startRun(run: EngineToolRun, now: number) {
  run.startTime = now;
  run.eta = now + run.durationMs;
  run.progress = 0;
}

export function cancelToolRun(session: HackingSessionInstance, runId: ToolRunId) {
  const run = session.toolRuns.find((r) => r.id === runId) as EngineToolRun | undefined;
  if (!run) return false;
  if (run.progress >= 1) return false; // cannot cancel completed
  run.canceled = true;
  return true;
}

function promoteQueued(session: HackingSessionInstance, now: number, concurrencyLimit: number) {
  const current = activeRunCount(session);
  const available = concurrencyLimit - current;
  if (available <= 0) return;
  const queued = session.toolRuns.filter(
    (r) => (r as EngineToolRun).durationMs !== undefined && r.startTime === 0 && !r.canceled,
  ) as EngineToolRun[];
  for (let i = 0; i < available && i < queued.length; i++) {
    startRun(queued[i], now);
  }
}

export function updateSession(
  session: HackingSessionInstance,
  now: number,
  concurrencyLimit: number,
) {
  // progress active runs
  for (const run of session.toolRuns as EngineToolRun[]) {
    if (run.canceled || run.startTime === 0 || run.progress >= 1) continue;
    const total = run.eta - run.startTime;
    if (total <= 0) {
      run.progress = 1;
    } else {
      run.progress = Math.min(1, (now - run.startTime) / total);
    }
    if (run.progress >= 1) {
      // mark defense bypassed
      const defense = session.defenses.find((d) => d.id === run.targetDefenseId);
      if (defense && defense.status !== 'bypassed') {
        defense.status = 'bypassed';
        defense.currentProgress = 1;
      }
    } else {
      const defense = session.defenses.find((d) => d.id === run.targetDefenseId);
      if (defense && defense.status === 'pending') defense.status = 'active';
      if (defense) defense.currentProgress = run.progress;
    }
  }
  // free capacity from canceled runs (not already progressed)
  promoteQueued(session, now, concurrencyLimit);
  session.lastTick = now;
  // If all defenses bypassed, mark success
  if (session.defenses.every((d) => d.status === 'bypassed')) {
    session.status = 'success';
  }
}

export function sessionActiveRuns(session: HackingSessionInstance): ToolRunId[] {
  return session.toolRuns
    .filter((r) => r.startTime > 0 && !r.canceled && r.progress < 1)
    .map((r) => r.id);
}
