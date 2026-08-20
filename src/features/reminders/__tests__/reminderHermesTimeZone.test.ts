import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from '@jest/globals';
import { scheduleNeuroplasticityReminders } from '../reminder-schedule-v2';

/**
 * Guards the Hermes time-zone bug.
 *
 * dayjs's timezone plugin resolves a zone offset by round-tripping through
 * `new Date(d.toLocaleString('en-US', { timeZone }))`. Hermes returns
 * `Invalid Date` for that string, so the offset became garbage derived from the
 * current clock and every reminder was shifted by however many minutes past the
 * hour it happened to be: the plan promised "8:27 PM" where the backend sends
 * 8:00 PM.
 *
 * Node has full ICU, so the value assertions below pass either way and cannot
 * catch a regression on their own. The import guard is the one that can.
 */
const ZONE = 'America/Los_Angeles';

const SESSIONS = [
    '2026-08-26T16:00:00.000Z',
    '2026-09-02T16:00:00.000Z',
    '2026-09-09T16:00:00.000Z',
];

const schedule = (nowUtc: string) =>
    scheduleNeuroplasticityReminders({
        nowUtc,
        sessionsUtc: SESSIONS,
        reflectionHour: 20,
        morningHour: 7,
        startAfterDays: 3,
        cadenceDays: 4,
        timeZone: ZONE,
        sessionDurationsMin: Object.fromEntries(SESSIONS.map((s) => [s, 50])),
    });

const minuteOf = (iso: string) =>
    Number(
        new Intl.DateTimeFormat('en-US', { timeZone: ZONE, minute: '2-digit' }).format(
            new Date(iso),
        ),
    );

describe('reminder instants are wall-clock exact', () => {
    it('always lands exactly on the hour', () => {
        const reminders = schedule('2026-08-20T00:27:00.000Z');

        expect(reminders.length).toBeGreaterThan(0);
        for (const reminder of reminders) {
            expect(minuteOf(reminder.atUtc)).toBe(0);
        }
    });

    // The bug made the offset a function of the current clock, so the same
    // sessions produced different reminder times minute to minute.
    it('does not depend on what minute it is now', () => {
        const atTwentySeven = schedule('2026-08-20T00:27:00.000Z').map((r) => r.atUtc);
        const onTheHour = schedule('2026-08-20T00:00:00.000Z').map((r) => r.atUtc);
        const atFortyOne = schedule('2026-08-20T00:41:00.000Z').map((r) => r.atUtc);

        expect(atTwentySeven).toEqual(onTheHour);
        expect(atFortyOne).toEqual(onTheHour);
    });
});

describe('the scheduler stays off dayjs time zones', () => {
    // This is the assertion that would actually have caught the bug. The value
    // assertions above pass under Node's full ICU whether or not the plugin is
    // used, so only the dependency itself distinguishes working from broken.
    it('does not import dayjs, whose timezone plugin is broken under Hermes', () => {
        const source = readFileSync(
            join(__dirname, '..', 'reminder-schedule-v2.ts'),
            'utf8',
        );

        expect(source).not.toMatch(/from 'dayjs/);
        expect(source).not.toMatch(/require\('dayjs/);
    });
});
