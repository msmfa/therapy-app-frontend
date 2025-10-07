import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { getPostSessionNoteReminders } from '../reminder-schedule-v2';

describe('getPostSessionNoteReminders', () => {
    const mockNow = new Date('2024-01-15T12:00:00Z');

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockNow);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('schedules reminders minutes after the end of each session', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    _id: 'session-123',
                    startsAtUtc: '2024-01-15T14:00:00Z',
                    durationMin: 50,
                },
            ],
            nowUtc: new Date().toISOString(),
            minutesAfterSession: 10,
        });

        expect(reminders).toHaveLength(1);
        expect(reminders[0]).toEqual({
            sessionId: 'session-123',
            sessionStartsAtUtc: '2024-01-15T14:00:00.000Z',
            remindAtUtc: '2024-01-15T15:00:00.000Z',
        });
    });

    it('skips reminders that would be in the past', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    _id: 'session-123',
                    startsAtUtc: '2024-01-15T09:00:00Z',
                    durationMin: 50,
                },
            ],
            nowUtc: new Date('2024-01-15T20:00:00Z').toISOString(),
            minutesAfterSession: 10,
        });

        expect(reminders).toHaveLength(0);
    });

    it('handles sessions without a duration by using only the offset', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    _id: 'session-123',
                    startsAtUtc: '2024-01-16T09:00:00Z',
                },
            ],
            nowUtc: new Date().toISOString(),
            minutesAfterSession: 10,
        });

        expect(reminders).toHaveLength(1);
        expect(reminders[0].remindAtUtc).toBe('2024-01-16T09:10:00.000Z');
    });

    it('supports sessions with zero recorded duration by relying on the offset only', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    _id: 'session-zero',
                    startsAtUtc: '2024-01-16T12:00:00Z',
                    durationMin: 0,
                },
            ],
            nowUtc: new Date().toISOString(),
            minutesAfterSession: 15,
        });

        expect(reminders).toEqual([
            {
                sessionId: 'session-zero',
                sessionStartsAtUtc: '2024-01-16T12:00:00.000Z',
                remindAtUtc: '2024-01-16T12:15:00.000Z',
            },
        ]);
    });

    it('returns reminders sorted chronologically when sessions mix id fields and durations', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    id: 'session-b',
                    startsAtUtc: '2024-01-16T13:00:00Z',
                    durationMin: 30,
                },
                {
                    _id: 'session-a',
                    startsAtUtc: '2024-01-16T09:00:00Z',
                    durationMin: 60,
                },
            ],
            nowUtc: new Date().toISOString(),
            minutesAfterSession: 15,
        });

        expect(reminders).toEqual([
            {
                sessionId: 'session-a',
                sessionStartsAtUtc: '2024-01-16T09:00:00.000Z',
                remindAtUtc: '2024-01-16T10:15:00.000Z',
            },
            {
                sessionId: 'session-b',
                sessionStartsAtUtc: '2024-01-16T13:00:00.000Z',
                remindAtUtc: '2024-01-16T13:45:00.000Z',
            },
        ]);
    });

    it('skips sessions that have not started yet when minutesAfterSession is negative', () => {
        const reminders = getPostSessionNoteReminders({
            sessions: [
                {
                    _id: 'session-negative',
                    startsAtUtc: '2024-01-16T15:00:00Z',
                    durationMin: 45,
                },
            ],
            nowUtc: new Date().toISOString(),
            minutesAfterSession: -5,
        });

        expect(reminders).toEqual([]);
    });
});
