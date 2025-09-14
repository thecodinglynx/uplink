import type { HackingSessionInstance } from '@domain/types';

// Updates the trace meter based on elapsed time & active noise events.
// Simple model: effectiveRate = baseRate + sum(dynamic) + sum(activeNoiseMagnitudes)
// noiseEvents entries expire after their expiresAt timestamp.
export function updateTrace(session: HackingSessionInstance, now: number) {
  const dtMs = now - session.lastTick;
  if (dtMs <= 0) return;
  // Aggregate noise across defenses and prune expired
  let noiseTotal = 0;
  for (const def of session.defenses) {
    def.noiseEvents = def.noiseEvents.filter((e) => e.expiresAt > now);
    for (const e of def.noiseEvents) noiseTotal += e.magnitude;
  }
  const base = session.trace.baseRate;
  const dynamic = session.trace.dynamicRateModifiers.reduce((a, b) => a + b, 0);
  const effectiveRatePerSecond = base + dynamic + noiseTotal;
  const delta = (dtMs / 1000) * effectiveRatePerSecond;
  session.trace.current = Math.min(session.trace.max, session.trace.current + delta);
  // derived ETA (if rate >0)
  if (effectiveRatePerSecond > 0) {
    session.trace.estimatedTimeToTrace =
      (session.trace.max - session.trace.current) / effectiveRatePerSecond;
  } else {
    session.trace.estimatedTimeToTrace = undefined;
  }
}

// Helper for tests / future events to inject transient noise.
export function addNoiseEvent(
  session: HackingSessionInstance,
  defenseId: string,
  magnitude: number,
  durationMs: number,
  now: number,
) {
  const def = session.defenses.find((d) => d.id === (defenseId as any));
  if (!def) throw new Error('defense not found');
  def.noiseEvents.push({ magnitude, expiresAt: now + durationMs });
}