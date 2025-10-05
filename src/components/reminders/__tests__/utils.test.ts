import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { calculateReminderTime, getSessionInterval, type ReminderTiming } from '../../../utils';

describe('reminder utils', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const nextSession = new Date('2024-01-03T12:00:00Z');

    const createTiming = (calculate: ReminderTiming['calculate']): ReminderTiming => ({
        id: 'test',
        label: 'Test timing',
        description: 'Used in tests',
        icon: 'bell',
        calculate,
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(now);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('calculateReminderTime', () => {
        it('returns null when there is no upcoming session', () => {
            const timing = createTiming(() => now);
            const result = calculateReminderTime('test', null, [timing]);
            expect(result).toBeNull();
        });

        it('returns null when the timing id is unknown', () => {
            const timing = createTiming(() => now);
            const result = calculateReminderTime('missing', nextSession, [timing]);
            expect(result).toBeNull();
        });

        it('returns the calculated future time', () => {
            const futureDate = new Date('2024-01-01T14:00:00Z');
            const timing = createTiming(() => futureDate);
            const result = calculateReminderTime('test', nextSession, [timing]);
            expect(result).toEqual(futureDate);
        });

        it('returns one hour from now when calculated time is in the past', () => {
            const pastDate = new Date('2024-01-01T10:00:00Z');
            const timing = createTiming(() => pastDate);
            const result = calculateReminderTime('test', nextSession, [timing]);
            expect(result).toEqual(new Date(now.getTime() + 60 * 60 * 1000));
        });

        it('filters out past entries when timing returns multiple reminders', () => {
            const timing = createTiming(() => [
                { time: new Date('2023-12-31T12:00:00Z'), message: 'past' },
                { time: new Date('2024-01-01T15:00:00Z'), message: 'future' },
            ]);
            const result = calculateReminderTime('test', nextSession, [timing]);
            expect(result).toEqual([
                { time: new Date('2024-01-01T15:00:00Z'), message: 'future' },
            ]);
        });

        it('returns null when all multiple reminders are in the past', () => {
            const timing = createTiming(() => [
                { time: new Date('2023-12-31T12:00:00Z'), message: 'past' },
            ]);
            const result = calculateReminderTime('test', nextSession, [timing]);
            expect(result).toBeNull();
        });
    });

    describe('getSessionInterval', () => {
        it('returns empty string when there is no upcoming session', () => {
            expect(getSessionInterval(null)).toBe('');
        });

        it('describes weekly sessions', () => {
            const sessionDate = new Date('2024-01-08T12:00:00Z');
            expect(getSessionInterval(sessionDate)).toBe('Weekly session');
        });

        it('describes bi-weekly sessions', () => {
            const sessionDate = new Date('2024-01-15T12:00:00Z');
            expect(getSessionInterval(sessionDate)).toBe('Bi-weekly session');
        });

        it('describes short gaps under a week', () => {
            const sessionDate = new Date('2024-01-04T12:00:00Z');
            expect(getSessionInterval(sessionDate)).toBe('3 days until session');
        });

        it('falls back to day countdown for longer gaps', () => {
            const sessionDate = new Date('2024-01-22T12:00:00Z');
            expect(getSessionInterval(sessionDate)).toBe('21 days until session');
        });
    });
});
