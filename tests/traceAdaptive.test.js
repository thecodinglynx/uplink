import { describe, it, expect } from 'vitest';
import { makeId } from '../src/domain/types';
import { createSession, queueToolRun, updateSession } from '../src/domain/hacking/engine';
import { addNoiseEvent } from '../src/domain/hacking/trace';
describe('trace & adaptive mechanics', () => {
    it('noise events increase trace rate then decay', () => {
        const missionId = makeId('m_noise');
        const start = Date.now();
        const session = createSession(missionId, 1, start, { defenseCount: 1 });
        const defId = session.defenses[0].id;
        // add noise magnitude 5 for 1000ms
        addNoiseEvent(session, defId, 5, 1000, start);
        // progress a tool run to keep session active
        queueToolRun(session, 'scanner', defId, start, 500, 1);
        updateSession(session, start + 500, 1); // half way through noise
        const midTrace = session.trace.current;
        expect(midTrace).toBeGreaterThan(2); // base 1 + noise 5 over 0.5s => ~3
        updateSession(session, start + 1600, 1); // after noise expiry
        const laterTrace = session.trace.current;
        // additional ~1s at base rate should not explode
        expect(laterTrace - midTrace).toBeLessThan(3);
    });
    it('adaptive applies only once', () => {
        const missionId = makeId('m_adapt');
        const start = Date.now();
        const session = createSession(missionId, 2, start, { defenseCount: 1 });
        const def = session.defenses[0];
        // artificially push trace above threshold over successive updates
        session.trace.current = session.trace.max * 0.55;
        updateSession(session, start + 100, 1);
        const tierAfterFirst = def.tier;
        expect(def.adaptiveApplied).toBe(true);
        // attempt again
        updateSession(session, start + 200, 1);
        expect(def.tier).toBe(tierAfterFirst); // no further increment
    });
    it('full trace causes failure state', () => {
        const missionId = makeId('m_fail');
        const start = Date.now();
        const session = createSession(missionId, 3, start, { defenseCount: 1 });
        session.trace.current = session.trace.max - 1; // near max
        // add strong noise to push over quickly
        addNoiseEvent(session, session.defenses[0].id, 50, 2000, start);
        queueToolRun(session, 'scanner', session.defenses[0].id, start, 5000, 1);
        updateSession(session, start + 500, 1);
        expect(session.status === 'failed' || session.trace.current >= session.trace.max).toBe(true);
    });
});
