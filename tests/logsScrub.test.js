import { describe, it, expect } from 'vitest';
import { makeId } from '../src/domain/types';
import { createSession } from '../src/domain/hacking/engine';
import { createLog, startScrub, advanceScrubbing, computeDetectionWeight, } from '../src/domain/hacking/logs';
describe('log system & scrub mechanic', () => {
    it('creates logs with categories and initiates scrub scaling by size', () => {
        const missionId = makeId('m_logs');
        const now = Date.now();
        const session = createSession(missionId, 5, now, { defenseCount: 0 });
        const lSmall = createLog(session, 'intrusion', 50, now);
        const lLarge = createLog(session, 'intrusion', 150, now);
        startScrub(session, lSmall, now, 100); // 100 bytes/sec
        startScrub(session, lLarge, now, 100);
        advanceScrubbing(session, now + 1000); // 1 second
        const small = session.logs.find((l) => l.id === lSmall);
        const large = session.logs.find((l) => l.id === lLarge);
        expect(small.scrubStatus).toBe('removed');
        expect(large.scrubStatus).toBe('scrubbing');
        expect(large.size).toBeGreaterThan(0);
    });
    it('reduces detection weight during partial scrub', () => {
        const missionId = makeId('m_weight');
        const now = Date.now();
        const session = createSession(missionId, 6, now, { defenseCount: 0 });
        const l1 = createLog(session, 'intrusion', 100, now);
        const l2 = createLog(session, 'intrusion', 100, now);
        const initial = computeDetectionWeight(session);
        expect(initial).toBe(200);
        startScrub(session, l2, now, 50); // 50 bytes/s => after 1s half removed -> size about 50
        advanceScrubbing(session, now + 1000);
        const after = computeDetectionWeight(session);
        expect(after).toBeLessThan(initial);
    });
});
