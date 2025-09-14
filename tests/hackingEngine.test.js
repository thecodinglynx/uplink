import { describe, it, expect } from 'vitest';
import { makeId } from '../src/domain/types';
import { createSession, queueToolRun, updateSession, cancelToolRun, sessionActiveRuns, } from '../src/domain/hacking/engine';
describe('hacking engine core', () => {
    it('enforces concurrency and starts queued runs when slots free', () => {
        const missionId = makeId('m_conc');
        const now = Date.now();
        const session = createSession(missionId, 123, now, { defenseCount: 2 });
        const d1 = session.defenses[0].id;
        const d2 = session.defenses[1].id;
        const conc = 2;
        queueToolRun(session, 'scanner', d1, now, 50, conc);
        queueToolRun(session, 'scanner', d2, now, 50, conc);
        // third queued
        queueToolRun(session, 'scanner', d1, now, 50, conc);
        expect(sessionActiveRuns(session).length).toBe(2);
        // advance time enough to finish first two
        updateSession(session, now + 60, conc);
        expect(session.defenses.filter((d) => d.status === 'bypassed').length).toBeGreaterThanOrEqual(1);
        // queued run should have started after completion
        expect(sessionActiveRuns(session).length).toBeLessThanOrEqual(conc);
    });
    it('cancel frees a slot and promotes queued run immediately', () => {
        const missionId = makeId('m_cancel');
        const now = Date.now();
        const session = createSession(missionId, 42, now, { defenseCount: 1 });
        const d1 = session.defenses[0].id;
        const conc = 1;
        const r1 = queueToolRun(session, 'scanner', d1, now, 1000, conc);
        const r2 = queueToolRun(session, 'scanner', d1, now, 1000, conc);
        // r2 queued
        expect(sessionActiveRuns(session)).toContain(r1);
        cancelToolRun(session, r1);
        updateSession(session, now + 11, conc);
        // r2 should now be active
        expect(sessionActiveRuns(session)).toContain(r2);
    });
    it('progress interpolates over time', () => {
        const missionId = makeId('m_progress');
        const now = Date.now();
        const session = createSession(missionId, 7, now, { defenseCount: 1 });
        const d1 = session.defenses[0].id;
        const conc = 1;
        queueToolRun(session, 'scanner', d1, now, 4000, conc);
        updateSession(session, now + 2000, conc);
        const run = session.toolRuns[0];
        expect(run.progress).toBeGreaterThan(0.45);
        expect(run.progress).toBeLessThan(0.55);
    });
});
