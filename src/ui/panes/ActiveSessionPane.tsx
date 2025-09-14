import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queueRun, tickSession } from '../../store/sessionSlice';
import type { RootState } from '../../store/store';

export function ActiveSessionPane() {
  const dispatch = useDispatch();
  const session = useSelector((s: RootState) => s.session.active);
  const tickMs = useSelector((s: RootState) => s.session.tickIntervalMs);
  const credits = useSelector((s: RootState) => s.ledger.profile.credits);

  const [autoTick, setAutoTick] = useState(true);
  const [autoQueue, setAutoQueue] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  // Lightweight clock for elapsed display (500ms cadence)
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session || !autoTick) return;
    const id = setInterval(() => {
      dispatch(tickSession({ now: Date.now() }));
    }, tickMs);
    return () => clearInterval(id);
  }, [session, tickMs, dispatch, autoTick]);

  if (!session) {
    return (
      <section data-pane="active-session" role="main" aria-labelledby="active-session-heading">
        <h2 id="active-session-heading">Active Session</h2>
        <p>No active session. Start one from the Mission Board.</p>
      </section>
    );
  }

  const tracePct = Math.round((session.trace.current / session.trace.max) * 100);
  const nextDefense = session.defenses.find((d) => d.status !== 'bypassed');
  const queueNext = () => {
    if (nextDefense) dispatch(queueRun({ defenseId: nextDefense.id, toolId: 'generic_tool' }));
  };
  const manualTick = () => dispatch(tickSession({ now: Date.now() }));
  const elapsedSec = ((now - session.startTimestamp) / 1000).toFixed(1);

  // Auto-queue effect
  useEffect(() => {
    if (!session || !autoQueue) return;
    if (session.status !== 'active') return;
    const next = session.defenses.find((d) => d.status !== 'bypassed');
    if (next) queueNext();
  }, [session, autoQueue]);

  return (
    <section data-pane="active-session" role="main" aria-labelledby="active-session-heading">
      <h2 id="active-session-heading">Active Session</h2>
      <div>Credits: {credits}</div>
      <div aria-label="trace status">Trace: {tracePct}%</div>
      <div>Seed: {session.seed}</div>
      <div>Elapsed: {elapsedSec}s</div>
      <div style={{ margin: '4px 0' }}>
        <label style={{ marginRight: 8 }}>
          <input
            type="checkbox"
            checked={autoTick}
            onChange={(e) => setAutoTick(e.target.checked)}
          />{' '}
          Auto Tick
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoQueue}
            onChange={(e) => setAutoQueue(e.target.checked)}
          />{' '}
          Auto Queue Next
        </label>
        {!autoTick && (
          <button style={{ marginLeft: 8 }} onClick={manualTick} aria-label="manual tick">
            Tick
          </button>
        )}
      </div>
      {session.toolRuns.some((r) => r.startTime > 0 && r.progress < 1 && !r.canceled) && (
        <div>
          <strong>Active Runs</strong>
          <ul>
            {session.toolRuns
              .filter((r) => r.startTime > 0 && r.progress < 1 && !r.canceled)
              .map((r) => {
                const remainingMs = Math.max(0, r.eta - now);
                return (
                  <li key={r.id}>
                    {r.toolId} vs {r.targetDefenseId} – {(r.progress * 100).toFixed(0)}% –
                    {` ${(remainingMs / 1000).toFixed(1)}s left`}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      <ul>
        {session.defenses.map((def) => (
          <li key={def.id}>
            {def.archetype} (tier {def.tier}) – {def.status} –{' '}
            {Math.round(def.currentProgress * 100)}%
          </li>
        ))}
      </ul>
      {session.status === 'active' && nextDefense && (
        <button onClick={queueNext}>Run Tool vs {nextDefense.archetype}</button>
      )}
      {session.status !== 'active' && <p>Session complete: {session.status}</p>}
    </section>
  );
}
