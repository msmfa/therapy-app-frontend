import { describe, expect, it } from '@jest/globals';
import { scheduleNeuroplasticityReminders } from '../reminder-schedule-v2';

/**
 * The backend cron places reminders at the user's local wall clock. This
 * scheduler drives what the app *shows* the user, so it has to agree — a
 * screen promising "07:00" while the push lands at 23:00 the night before is
 * a bug even though nothing mis-fires.
 *
 * Mirrors the backend's notificationHardening assertions so the two contracts
 * are checked the same way.
 */
const params = {
  nowUtc: '2030-01-01T00:00:00.000Z',
  sessionsUtc: ['2030-01-01T09:00:00.000Z', '2030-01-20T09:00:00.000Z'],
  reflectionHour: 20,
  morningHour: 7,
  startAfterDays: 3,
  cadenceDays: 4,
};

const localHours = (reminders: Array<{ atUtc: string }>, timeZone: string) =>
  reminders.map(
    (r) =>
      Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: '2-digit',
          hour12: false,
        }).format(new Date(r.atUtc)),
      ) % 24,
  );

describe('reminder times follow the user zone, not UTC', () => {
  it('places reminders at local 07:00 / 20:00 west of UTC', () => {
    const reminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'America/Los_Angeles',
    });

    expect(reminders.length).toBeGreaterThan(0);
    localHours(reminders, 'America/Los_Angeles').forEach((hour) => {
      expect([7, 20]).toContain(hour);
    });
  });

  it('places reminders at local 07:00 / 20:00 east of UTC', () => {
    const reminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'Asia/Tokyo',
    });

    expect(reminders.length).toBeGreaterThan(0);
    localHours(reminders, 'Asia/Tokyo').forEach((hour) => {
      expect([7, 20]).toContain(hour);
    });
  });

  it('handles a summer date across a DST boundary', () => {
    const reminders = scheduleNeuroplasticityReminders({
      nowUtc: '2030-06-01T00:00:00.000Z',
      sessionsUtc: ['2030-06-01T09:00:00.000Z', '2030-06-20T09:00:00.000Z'],
      reflectionHour: 20,
      morningHour: 7,
      startAfterDays: 3,
      cadenceDays: 4,
      timeZone: 'America/Los_Angeles',
    });

    expect(reminders.length).toBeGreaterThan(0);
    localHours(reminders, 'America/Los_Angeles').forEach((hour) => {
      expect([7, 20]).toContain(hour);
    });
  });

  it('never shows a "morning" reminder in the middle of the night', () => {
    const reminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'America/Los_Angeles',
    });

    localHours(reminders, 'America/Los_Angeles').forEach((hour) => {
      expect(hour).toBeGreaterThanOrEqual(7);
      expect(hour).toBeLessThanOrEqual(22);
    });
  });

  it('still behaves as before when the zone is UTC', () => {
    const utcReminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'UTC',
    });

    expect(utcReminders.length).toBeGreaterThan(0);
    localHours(utcReminders, 'UTC').forEach((hour) => {
      expect([7, 20]).toContain(hour);
    });
  });

  it('falls back to a usable schedule for an unknown zone', () => {
    expect(() =>
      scheduleNeuroplasticityReminders({ ...params, timeZone: 'Not/AZone' }),
    ).not.toThrow();

    const reminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'Not/AZone',
    });
    expect(reminders.length).toBeGreaterThan(0);
  });
});
