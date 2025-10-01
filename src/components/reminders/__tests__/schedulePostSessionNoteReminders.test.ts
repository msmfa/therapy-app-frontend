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
});

