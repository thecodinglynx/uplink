const g = globalThis;
if (!g.__uplinkPerfMetrics) {
    g.__uplinkPerfMetrics = {
        tickSamples: [],
        persistenceWrites: [],
    };
}
const metrics = g.__uplinkPerfMetrics;
export function recordTick(durationMs) {
    metrics.tickSamples.push({ timestamp: Date.now(), durationMs });
    if (metrics.tickSamples.length > 200)
        metrics.tickSamples.shift();
}
export function recordPersistenceWrite(sample) {
    metrics.persistenceWrites.push({ timestamp: Date.now(), ...sample });
    if (metrics.persistenceWrites.length > 200)
        metrics.persistenceWrites.shift();
}
export function getMetrics() {
    return metrics;
}
export function resetMetrics() {
    metrics.tickSamples.length = 0;
    metrics.persistenceWrites.length = 0;
}
