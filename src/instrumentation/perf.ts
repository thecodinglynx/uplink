interface TickSample {
  timestamp: number;
  durationMs: number;
}
interface PersistenceWriteSample {
  timestamp: number;
  bytes: number;
  ms: number;
}

const g = globalThis as any;
if (!g.__uplinkPerfMetrics) {
  g.__uplinkPerfMetrics = {
    tickSamples: [] as TickSample[],
    persistenceWrites: [] as PersistenceWriteSample[],
  };
}
const metrics: { tickSamples: TickSample[]; persistenceWrites: PersistenceWriteSample[] } =
  g.__uplinkPerfMetrics;

export function recordTick(durationMs: number) {
  metrics.tickSamples.push({ timestamp: Date.now(), durationMs });
  if (metrics.tickSamples.length > 200) metrics.tickSamples.shift();
}

export function recordPersistenceWrite(sample: { bytes: number; ms: number }) {
  metrics.persistenceWrites.push({ timestamp: Date.now(), ...sample });
  if (metrics.persistenceWrites.length > 200) metrics.persistenceWrites.shift();
}

export function getMetrics() {
  return metrics;
}
export function resetMetrics() {
  metrics.tickSamples.length = 0;
  metrics.persistenceWrites.length = 0;
}
