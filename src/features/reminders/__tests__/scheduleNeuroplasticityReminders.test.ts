import { describe, expect, it } from '@jest/globals';
import { scheduleNeuroplasticityReminders } from '../reminder-schedule-v2';

describe('scheduleNeuroplasticityReminders', () => {
    const baseParams: Parameters<typeof scheduleNeuroplasticityReminders>[0] = {
        nowUtc: '2024-01-01T10:00:00.000Z',
        reflectionHour: 20,
        morningHour: 7,
        sessionsUtc: [
            '2024-01-01T14:00:00.000Z',
            '2024-01-08T14:00:00.000Z',
        ],
    };

    const runSchedule = (
        overrides: Partial<Parameters<typeof scheduleNeuroplasticityReminders>[0]>,
    ) => scheduleNeuroplasticityReminders({ ...baseParams, ...overrides });

    it('returns no reminders when there is only one session on the calendar', () => {
        const reminders = scheduleNeuroplasticityReminders({
            ...baseParams,
            sessionsUtc: ['2024-01-01T14:00:00.000Z'],
        });

        expect(reminders).toEqual([]);
    });

    it('returns no reminders when the current time is invalid', () => {
        const reminders = scheduleNeuroplasticityReminders({
            ...baseParams,
            nowUtc: 'definitely-not-a-date',
        });

        expect(reminders).toEqual([]);
    });

    it('produces four reminders for a typical 7-day gap', () => {
        const reminders = runSchedule({});

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-01T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-02T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-04T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-07T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('limits a 48-hour gap to the post- and pre-session reminders', () => {
        const reminders = runSchedule({
            sessionsUtc: [
                '2024-01-03T11:00:00.000Z',
                '2024-01-01T14:00:00.000Z',
            ],
        });

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-01T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-02T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('adds the next-morning reminder once the gap spans at least three days', () => {
        const reminders = runSchedule({
            sessionsUtc: [
                '2024-01-01T14:00:00.000Z',
                '2024-01-04T14:00:00.000Z',
            ],
        });

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-01T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-02T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-03T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('includes two mid-session reminders during a 10-day gap', () => {
        const reminders = runSchedule({
            sessionsUtc: [
                '2024-01-01T14:00:00.000Z',
                '2024-01-11T14:00:00.000Z',
            ],
        });

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-01T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-02T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-04T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-08T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-10T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('schedules regular mid-session check-ins when sessions are a month apart', () => {
        const reminders = runSchedule({
            sessionsUtc: [
                '2024-01-01T14:00:00.000Z',
                '2024-01-31T14:00:00.000Z',
            ],
        });

        const midSessions = reminders.filter((reminder) => reminder.reason === 'mid_session');
        expect(reminders).toHaveLength(10);
        expect(midSessions).toHaveLength(7);
        expect(midSessions[0]?.atUtc).toBe('2024-01-04T20:00:00.000Z');
        expect(midSessions[midSessions.length - 1]?.atUtc).toBe('2024-01-28T20:00:00.000Z');

        const preSession = reminders.find((reminder) => reminder.reason === 'pre_session');
        expect(preSession?.atUtc).toBe('2024-01-30T20:00:00.000Z');
    });

    it('ignores reminders that would have already happened relative to now', () => {
        const reminders = runSchedule({
            nowUtc: '2024-01-04T21:00:00.000Z',
        });

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-07T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('keeps results aligned with session order even if the input is unsorted', () => {
        const reminders = scheduleNeuroplasticityReminders({
            ...baseParams,
            sessionsUtc: [
                '2024-01-08T14:00:00.000Z',
                '2024-01-01T14:00:00.000Z',
            ],
        });

        expect(reminders).toEqual([
            {
                atUtc: '2024-01-01T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-02T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-04T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-01-07T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);
    });

    it('labels reminders with the correct gap index when there are multiple gaps', () => {
        const reminders = scheduleNeuroplasticityReminders({
            ...baseParams,
            sessionsUtc: [
                '2024-01-01T14:00:00.000Z',
                '2024-01-05T14:00:00.000Z',
                '2024-01-12T14:00:00.000Z',
            ],
        });

        const firstGapReasons = reminders
            .filter((reminder) => reminder.gapIndex === 0)
            .map((reminder) => reminder.reason);
        const secondGapReasons = reminders
            .filter((reminder) => reminder.gapIndex === 1)
            .map((reminder) => reminder.reason);

        expect(firstGapReasons).toEqual([
            'post_session',
            'post_sleep',
            'pre_session',
        ]);
        expect(secondGapReasons).toEqual([
            'post_session',
            'post_sleep',
            'mid_session',
            'pre_session',
        ]);
    });

    it('breaks out reminders correctly when some weeks have single sessions and others have two', () => {
        const reminders = scheduleNeuroplasticityReminders({
            ...baseParams,
            sessionsUtc: [
                '2024-02-05T15:00:00.000Z', // Monday
                '2024-02-07T15:00:00.000Z', // Wednesday same week
                '2024-02-14T15:00:00.000Z', // Following Wednesday
                '2024-02-21T15:00:00.000Z', // Wednesday next week
            ],
        });

        const gap0 = reminders.filter((reminder) => reminder.gapIndex === 0);
        const gap1 = reminders.filter((reminder) => reminder.gapIndex === 1);
        const gap2 = reminders.filter((reminder) => reminder.gapIndex === 2);

        expect(gap0).toEqual([
            {
                atUtc: '2024-02-05T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 0,
            },
            {
                atUtc: '2024-02-06T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 0,
            },
        ]);

        expect(gap1).toEqual([
            {
                atUtc: '2024-02-07T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 1,
            },
            {
                atUtc: '2024-02-08T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 1,
            },
            {
                atUtc: '2024-02-10T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 1,
            },
            {
                atUtc: '2024-02-13T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 1,
            },
        ]);

        expect(gap2).toEqual([
            {
                atUtc: '2024-02-14T20:00:00.000Z',
                reason: 'post_session',
                gapIndex: 2,
            },
            {
                atUtc: '2024-02-15T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 2,
            },
            {
                atUtc: '2024-02-17T20:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 2,
            },
            {
                atUtc: '2024-02-20T20:00:00.000Z',
                reason: 'pre_session',
                gapIndex: 2,
            },
        ]);
    });
});
