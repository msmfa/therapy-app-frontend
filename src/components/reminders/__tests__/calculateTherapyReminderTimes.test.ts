import { calculateTherapyReminderTimes } from '../reminder-schedule-algo';

describe('calculateTherapyReminderTimes', () => {
	// Mock current time to make tests predictable
	const mockNow = new Date('2024-01-15T10:00:00');
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(mockNow);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('1-2 day gaps', () => {
		it('returns only hour-after reminder for 1 day gap', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-16T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(1);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00'));
		});

		it('returns only hour-after reminder for 2 day gap', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-17T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(1);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00'));
		});
	});

	describe('3-6 day gaps', () => {
		it('handles 4 day gap correctly', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-19T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(3);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-17T20:00:00')); // Day 2
			expect(reminders[2]).toEqual(new Date('2024-01-18T20:00:00')); // Day 3 (day before)
		});

		it('handles 3 day gap where day 2 is also day-before', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-18T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(2);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-17T20:00:00')); // Day 2 (also day-before)
		});
	});

	describe('7-14 day gaps', () => {
		it('handles weekly (7 day) gap', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-22T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(4);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-17T20:00:00')); // Day 2
			expect(reminders[2]).toEqual(new Date('2024-01-20T20:00:00')); // Day 5
			expect(reminders[3]).toEqual(new Date('2024-01-21T20:00:00')); // Day 6 (day before)
		});

		it('handles biweekly (14 day) gap', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-29T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(4);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-19T20:00:00')); // Day 4
			expect(reminders[2]).toEqual(new Date('2024-01-24T20:00:00')); // Day 9
			expect(reminders[3]).toEqual(new Date('2024-01-28T20:00:00')); // Day 13 (day before)
		});
	});

	describe('21-31 day gaps', () => {
		it('handles monthly (28 day) gap', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-02-12T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(5);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-18T20:00:00')); // Day 3
			expect(reminders[2]).toEqual(new Date('2024-01-26T20:00:00')); // Day 11
			expect(reminders[3]).toEqual(new Date('2024-02-04T20:00:00')); // Day 20
			expect(reminders[4]).toEqual(new Date('2024-02-11T20:00:00')); // Day 27 (day before)
		});

		it('handles 21 day gap where day 20 overlaps with day-before', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-02-05T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(4);
			expect(reminders[0]).toEqual(new Date('2024-01-15T15:00:00')); // Hour after
			expect(reminders[1]).toEqual(new Date('2024-01-18T20:00:00')); // Day 3
			expect(reminders[2]).toEqual(new Date('2024-01-26T20:00:00')); // Day 11
			expect(reminders[3]).toEqual(new Date('2024-02-04T20:00:00')); // Day 20 (also day-before)
		});
	});

	describe('edge cases', () => {
		it('returns empty array for gaps longer than 31 days', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-02-20T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(0);
		});

		it('filters out past reminders', () => {
			// Session was yesterday, so hour-after reminder is in the past
			const lastSession = new Date('2024-01-14T14:00:00');
			const nextSession = new Date('2024-01-21T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			// Should only get future reminders (day 2, 5, 6)
			expect(reminders).toHaveLength(3);
			expect(reminders[0]).toEqual(new Date('2024-01-16T20:00:00')); // Day 2
		});

		it('respects custom reminder hour', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-19T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession, 21);

			expect(reminders[1]).toEqual(new Date('2024-01-17T21:00:00')); // Day 2 at 9 PM
			expect(reminders[2]).toEqual(new Date('2024-01-18T21:00:00')); // Day 3 at 9 PM
		});

		it('sorts reminders chronologically', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-22T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			for (let i = 1; i < reminders.length; i++) {
				expect(reminders[i].getTime()).toBeGreaterThan(reminders[i - 1].getTime());
			}
		});
	});

	describe('additional edge cases', () => {
		it('handles same-day sessions (0 day gap)', () => {
			const lastSession = new Date('2024-01-15T10:00:00');
			const nextSession = new Date('2024-01-15T16:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			// Should return empty or handle specially
			expect(reminders).toHaveLength(0);
		});

		it('handles invalid reminder hour gracefully', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-19T14:00:00');

			// Test with invalid hours
			const reminders1 = calculateTherapyReminderTimes(lastSession, nextSession, 25);
			const reminders2 = calculateTherapyReminderTimes(lastSession, nextSession, -1);

			// Should either throw error or default to valid hour
			// Depends on your implementation
		});

		it('handles sessions crossing daylight saving time', () => {
			// Spring forward (lose an hour) - March 10, 2024
			const lastSession = new Date('2024-03-09T14:00:00');
			const nextSession = new Date('2024-03-16T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			// Verify times are calculated correctly across DST change
			expect(reminders).toHaveLength(4);
		});

		it('handles late night sessions', () => {
			const lastSession = new Date('2024-01-15T23:00:00'); // 11 PM session
			const nextSession = new Date('2024-01-22T23:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			// Hour-after should roll to next day
			expect(reminders[0]).toEqual(new Date('2024-01-16T00:00:00'));
		});

		it('handles sessions with seconds/milliseconds', () => {
			const lastSession = new Date('2024-01-15T14:30:45.123');
			const nextSession = new Date('2024-01-22T14:30:45.123');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			// Should normalize to clean times
			expect(reminders[1].getSeconds()).toBe(0);
			expect(reminders[1].getMilliseconds()).toBe(0);
		});

		it('handles reminder hour at midnight', () => {
			const lastSession = new Date('2024-01-15T14:00:00');
			const nextSession = new Date('2024-01-19T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession, 0);

			// Reminders should be at midnight
			expect(reminders[1]).toEqual(new Date('2024-01-17T00:00:00'));
		});

		it('handles gap calculation across month boundaries', () => {
			const lastSession = new Date('2024-01-30T14:00:00');
			const nextSession = new Date('2024-02-02T14:00:00'); // 3 day gap

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(2);
		});

		it('handles gap calculation across year boundaries', () => {
			const lastSession = new Date('2024-12-30T14:00:00');
			const nextSession = new Date('2025-01-06T14:00:00'); // 7 day gap

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(4);
		});

		it('handles leap year correctly', () => {
			const lastSession = new Date('2024-02-28T14:00:00');
			const nextSession = new Date('2024-03-06T14:00:00'); // 7 days in leap year

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(4);
			// Day 2 should be March 1st
			expect(reminders[1]).toEqual(new Date('2024-03-01T20:00:00'));
		});

		it('returns empty array when all reminders are in the past', () => {
			// Session was weeks ago
			const lastSession = new Date('2024-01-01T14:00:00');
			const nextSession = new Date('2024-01-08T14:00:00');

			const reminders = calculateTherapyReminderTimes(lastSession, nextSession);

			expect(reminders).toHaveLength(0);
		});
	});
});
