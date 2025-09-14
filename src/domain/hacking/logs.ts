import type { HackingSessionInstance, LogId, LogEntry, LogCategory } from '../types';

// Internal scrub metadata per session/log
interface ScrubMeta {
  ratePerSecond: number;
  startedAt: number;
  originalSize: number;
}
const scrubMetaStore = new WeakMap<HackingSessionInstance, Map<LogId, ScrubMeta>>();

function getMetaMap(session: HackingSessionInstance) {
  let map = scrubMetaStore.get(session);
  if (!map) {
    map = new Map();
    scrubMetaStore.set(session, map);
  }
  return map;
}

let logCounter = 0;
function makeLogId(): LogId {
  logCounter += 1;
  return `log_${logCounter}` as LogId;
}

export function createLog(
  session: HackingSessionInstance,
  category: LogCategory,
  size: number,
  now: number,
): LogId {
  const id = makeLogId();
  const entry: LogEntry = { id, category, timestamp: now, size, scrubStatus: 'present' };
  session.logs.push(entry);
  return id;
}

export function startScrub(
  session: HackingSessionInstance,
  logId: LogId,
  now: number,
  ratePerSecond: number,
) {
  const log = session.logs.find((l) => l.id === logId);
  if (!log || log.scrubStatus === 'removed') return false;
  if (log.scrubStatus === 'scrubbing') return true;
  log.scrubStatus = 'scrubbing';
  getMetaMap(session).set(logId, { ratePerSecond, startedAt: now, originalSize: log.size });
  return true;
}

export function advanceScrubbing(session: HackingSessionInstance, now: number) {
  const metaMap = getMetaMap(session);
  for (const log of session.logs) {
    if (log.scrubStatus !== 'scrubbing') continue;
    const meta = metaMap.get(log.id);
    if (!meta) continue;
    const elapsed = (now - meta.startedAt) / 1000;
    const removedBytes = elapsed * meta.ratePerSecond;
    if (removedBytes >= meta.originalSize) {
      log.scrubStatus = 'removed';
      log.size = 0;
      metaMap.delete(log.id);
    } else {
      // partial
      log.size = Math.max(1, Math.ceil(meta.originalSize - removedBytes));
      log.scrubStatus = 'scrubbing';
    }
  }
}

// Detection weight heuristic: intrusion logs present contribute full size; partial (scrubbing) contributes 0.25x.
export function computeDetectionWeight(session: HackingSessionInstance): number {
  let weight = 0;
  for (const log of session.logs) {
    if (log.category !== 'intrusion') continue;
    if (log.scrubStatus === 'present') weight += log.size;
    else if (log.scrubStatus === 'scrubbing') weight += log.size * 0.25;
  }
  return weight;
}
