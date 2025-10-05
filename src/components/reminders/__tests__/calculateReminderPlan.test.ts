import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { calculateReminderPlan } from '../reminder-schedule-algo';

describe('calculateReminderPlan', () => {
    const defaultNow = new Date('2024-01-20T12:00:00Z');

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(defaultNow);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('merges reminders from multiple sessions, filters past times, and sorts the result', () => {
        const sessions = [
            new Date('2024-01-15T14:00:00Z'),
            new Date('2024-01-22T14:00:00Z'),
            new Date('2024-02-05T14:00:00Z'),
        ];

        const reminders = calculateReminderPlan(sessions);

        expect(reminders).toEqual([
            new Date('2024-01-21T20:00:00.000Z'),
            new Date('2024-01-22T15:00:00.000Z'),
            new Date('2024-01-26T20:00:00.000Z'),
            new Date('2024-01-31T20:00:00.000Z'),
            new Date('2024-02-04T20:00:00.000Z'),
        ]);

        for (let index = 1; index < reminders.length; index += 1) {
            expect(reminders[index].getTime()).toBeGreaterThan(reminders[index - 1].getTime());
        }

        const filteredOutReminder = new Date('2024-01-17T20:00:00.000Z').getTime();
        expect(reminders.some((reminder) => reminder.getTime() === filteredOutReminder)).toBe(false);
    });

    it('returns an empty array when fewer than two sessions are provided', () => {
        const reminders = calculateReminderPlan([new Date('2024-01-15T14:00:00Z')]);
        expect(reminders).toEqual([]);
    });

    it('respects the provided reminder hour for future sessions', () => {
        const customNow = new Date('2024-01-05T10:00:00Z');
        jest.setSystemTime(customNow);

        const sessions = [
            new Date('2024-01-05T14:00:00Z'),
            new Date('2024-01-12T14:00:00Z'),
            new Date('2024-01-19T14:00:00Z'),
        ];

        const reminders = calculateReminderPlan(sessions, 9);

        expect(reminders).toEqual([
            new Date('2024-01-05T15:00:00.000Z'),
            new Date('2024-01-07T09:00:00.000Z'),
            new Date('2024-01-11T09:00:00.000Z'),
            new Date('2024-01-12T15:00:00.000Z'),
            new Date('2024-01-14T09:00:00.000Z'),
            new Date('2024-01-18T09:00:00.000Z'),
        ]);

        expect(reminders.filter((date) => date.getUTCHours() === 9).length).toBeGreaterThan(0);
    });
});
