import { projectSessions } from '../../features/onboarding/sessionSeries';
import {
    CALENDAR_YEARS_AHEAD,
    SERIES_MONTHS_AHEAD,
    addCalendarMonths,
    getSessionsWindow,
    isWithinFirstSessionWindow,
    latestFirstSessionAt,
} from '../sessionWindow';

const at = (iso: string) => new Date(iso);

describe('the latest first session onboarding accepts', () => {
    const now = at('2026-09-04T10:00:00');

    it('accepts the maximum permitted date', () => {
        expect(isWithinFirstSessionWindow(latestFirstSessionAt(now), now)).toBe(true);
    });

    it('rejects the day after the maximum', () => {
        const beyond = new Date(latestFirstSessionAt(now));
        beyond.setDate(beyond.getDate() + 1);

        expect(isWithinFirstSessionWindow(beyond, now)).toBe(false);
    });

    it('accepts any time of day on the maximum date', () => {
        const maximum = latestFirstSessionAt(now);
        const earlyThatDay = new Date(maximum);
        earlyThatDay.setHours(0, 1, 0, 0);
        const lateThatDay = new Date(maximum);
        lateThatDay.setHours(23, 30, 0, 0);

        expect(isWithinFirstSessionWindow(earlyThatDay, now)).toBe(true);
        expect(isWithinFirstSessionWindow(lateThatDay, now)).toBe(true);
    });

    it('runs to the very end of the final local day', () => {
        const maximum = latestFirstSessionAt(now);

        expect(maximum.getHours()).toBe(23);
        expect(maximum.getMinutes()).toBe(59);
        expect(maximum.getSeconds()).toBe(59);
        expect(maximum.getMilliseconds()).toBe(999);
    });

    it('is six calendar months out, not 180 days', () => {
        const maximum = latestFirstSessionAt(at('2026-01-15T09:00:00'));

        expect(maximum.getFullYear()).toBe(2026);
        expect(maximum.getMonth()).toBe(6); // July
        expect(maximum.getDate()).toBe(15);
    });
});

describe('calendar-month arithmetic', () => {
    it('clamps to the last day of a shorter month', () => {
        // Naive setMonth overflow would land on 2 or 3 March.
        const result = addCalendarMonths(at('2026-08-31T12:00:00'), SERIES_MONTHS_AHEAD);

        expect(result.getFullYear()).toBe(2027);
        expect(result.getMonth()).toBe(1); // February
        expect(result.getDate()).toBe(28);
    });

    it('lands on 29 February in a leap year', () => {
        const result = addCalendarMonths(at('2028-08-29T12:00:00'), SERIES_MONTHS_AHEAD);

        expect(result.getFullYear()).toBe(2029);
        expect(result.getMonth()).toBe(1);
        // 2029 is not a leap year, so the 29th clamps to the 28th.
        expect(result.getDate()).toBe(28);
    });

    it('keeps 29 February when the target month has one', () => {
        const result = addCalendarMonths(at('2027-08-31T12:00:00'), SERIES_MONTHS_AHEAD);

        expect(result.getFullYear()).toBe(2028);
        expect(result.getMonth()).toBe(1);
        // 2028 is a leap year, so 31 August clamps to the 29th, not the 28th.
        expect(result.getDate()).toBe(29);
    });

    it('carries across a year boundary', () => {
        const result = addCalendarMonths(at('2026-11-30T12:00:00'), SERIES_MONTHS_AHEAD);

        expect(result.getFullYear()).toBe(2027);
        expect(result.getMonth()).toBe(4); // May
        expect(result.getDate()).toBe(30);
    });

    it('preserves the local wall-clock time', () => {
        const result = addCalendarMonths(at('2026-09-04T17:30:00'), SERIES_MONTHS_AHEAD);

        expect(result.getHours()).toBe(17);
        expect(result.getMinutes()).toBe(30);
    });
});

describe('the onboarding limit and the calendar window cannot drift apart', () => {
    // The bug this guards: onboarding accepted any future date and projected
    // six months of sessions from it, while the calendar only ever fetched a
    // year out, so a distant first session created records nobody could see.
    const startingPoints = [
        '2026-01-15T09:00:00',
        '2026-01-31T23:00:00',
        '2026-08-31T18:00:00',
        '2027-02-28T08:00:00',
        '2028-02-29T20:00:00',
        '2026-11-30T07:30:00',
        '2026-12-31T21:45:00',
    ];

    it.each(startingPoints)(
        'keeps every session projected from the latest permitted first date inside the editable window (%s)',
        (iso) => {
            const now = at(iso);
            const window = getSessionsWindow(now);
            const firstSessionAt = latestFirstSessionAt(now);

            // Weekly is the densest cadence and so produces the last occurrence
            // furthest from the first session.
            for (const cadence of ['weekly', 'fortnightly', 'monthly'] as const) {
                const sessions = projectSessions({ firstSessionAt, cadence });
                const last = sessions[sessions.length - 1];

                expect(last.getTime()).toBeGreaterThanOrEqual(window.from.getTime());
                expect(last.getTime()).toBeLessThanOrEqual(window.to.getTime());
            }
        },
    );

    it('spans a year, so the series horizon is reachable at all', () => {
        const now = at('2026-09-04T10:00:00');
        const window = getSessionsWindow(now);

        expect(window.to.getFullYear()).toBe(now.getFullYear() + CALENDAR_YEARS_AHEAD);
        expect(window.from.getHours()).toBe(0);
        expect(window.to.getHours()).toBe(23);
    });
});
