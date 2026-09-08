import { SERIES_MONTHS_AHEAD, nextSessionAfterFirst, projectSessions } from '../sessionSeries';

const at = (iso: string) => new Date(iso);

// A Tuesday.
const FIRST = at('2026-03-03T17:00:00');

describe('projectSessions', () => {
    it('keeps the same weekday and time every week', () => {
        const sessions = projectSessions({ firstSessionAt: FIRST, cadence: 'weekly' });

        expect(sessions[0]).toEqual(FIRST);
        sessions.forEach((session) => {
            expect(session.getDay()).toBe(FIRST.getDay());
            expect(session.getHours()).toBe(17);
            expect(session.getMinutes()).toBe(0);
        });
        expect(sessions[1].getDate()).toBe(10);
        expect(sessions[2].getDate()).toBe(17);
    });

    it('steps a fortnight at a time', () => {
        const sessions = projectSessions({ firstSessionAt: FIRST, cadence: 'fortnightly' });

        expect(sessions[1].getDate()).toBe(17);
        expect(sessions[2].getDate()).toBe(31);
    });

    it('keeps the same date each calendar month', () => {
        const sessions = projectSessions({ firstSessionAt: FIRST, cadence: 'monthly' });

        expect(sessions[1].getMonth()).toBe(3);
        expect(sessions[1].getDate()).toBe(3);
        expect(sessions[2].getMonth()).toBe(4);
    });

    it('clamps a month-end date into a shorter month', () => {
        const sessions = projectSessions({
            firstSessionAt: at('2026-01-31T09:00:00'),
            cadence: 'monthly',
        });

        // February has no 31st, so the session lands on the last day it has.
        expect(sessions[1].getMonth()).toBe(1);
        expect(sessions[1].getDate()).toBe(28);
        expect(sessions[1].getHours()).toBe(9);
    });

    it('covers six months and stops there', () => {
        const sessions = projectSessions({ firstSessionAt: FIRST, cadence: 'weekly' });
        const horizon = new Date(FIRST);
        horizon.setMonth(horizon.getMonth() + SERIES_MONTHS_AHEAD);

        expect(sessions.length).toBeGreaterThan(20);
        expect(sessions[sessions.length - 1].getTime()).toBeLessThanOrEqual(horizon.getTime());
    });

    it('projects nothing beyond the confirmed session when the schedule varies', () => {
        expect(projectSessions({ firstSessionAt: FIRST, cadence: 'varies' })).toEqual([FIRST]);
        expect(projectSessions({ firstSessionAt: FIRST, cadence: null })).toEqual([FIRST]);
    });

    it('returns sessions in order, with no duplicates', () => {
        const sessions = projectSessions({ firstSessionAt: FIRST, cadence: 'fortnightly' });
        const times = sessions.map((session) => session.getTime());

        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(new Set(times).size).toBe(times.length);
    });
});

describe('nextSessionAfterFirst', () => {
    it('is the following appointment for a recurring schedule', () => {
        const next = nextSessionAfterFirst({ firstSessionAt: FIRST, cadence: 'weekly' });

        expect(next?.getDate()).toBe(10);
        expect(next?.getHours()).toBe(17);
    });

    it('is null when no further appointment can be known', () => {
        expect(nextSessionAfterFirst({ firstSessionAt: FIRST, cadence: 'varies' })).toBeNull();
        expect(nextSessionAfterFirst({ firstSessionAt: FIRST, cadence: null })).toBeNull();
    });
});

describe('the schedule handed to the therapy-session API', () => {
    it('produces one entry per appointment, keyed uniquely', () => {
        // Mirrors what Success sends to syncSessions.
        const projected = projectSessions({ firstSessionAt: FIRST, cadence: 'weekly' });
        const selected: Record<string, Date> = {};
        for (const session of projected) {
            selected[session.toISOString()] = session;
        }

        expect(Object.keys(selected)).toHaveLength(projected.length);
        expect(Object.values(selected)[0]).toEqual(FIRST);
    });

    it('saves the confirmed session even when the schedule varies', () => {
        const projected = projectSessions({ firstSessionAt: FIRST, cadence: 'varies' });

        expect(projected).toEqual([FIRST]);
    });
});
