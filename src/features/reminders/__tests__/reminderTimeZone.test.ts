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

describe('daylight-saving transitions inside a gap', () => {
  // US DST 2030 begins Sunday 10 March. A session on the 9th (PST, -08:00)
  // followed by reminders on the 10th and later (PDT, -07:00).
  const springForward = {
    nowUtc: '2030-03-09T00:00:00.000Z',
    sessionsUtc: ['2030-03-09T22:00:00.000Z', '2030-03-30T22:00:00.000Z'],
    reflectionHour: 20,
    morningHour: 7,
    startAfterDays: 3,
    cadenceDays: 4,
    timeZone: 'America/Los_Angeles',
  };

  it('keeps every reminder on its intended local hour across spring-forward', () => {
    const reminders = scheduleNeuroplasticityReminders(springForward);

    expect(reminders.length).toBeGreaterThan(0);
    // dayjs .tz() instances keep the offset they were created with, so
    // add(1, 'day') across the transition silently yields 08:00 instead of
    // 07:00 unless the zone is reapplied after the calendar arithmetic.
    localHours(reminders, 'America/Los_Angeles').forEach((hour) => {
      expect([7, 20]).toContain(hour);
    });
  });

  it('keeps local hours across autumn fall-back too', () => {
    // US DST 2030 ends Sunday 3 November.
    const reminders = scheduleNeuroplasticityReminders({
      nowUtc: '2030-11-01T00:00:00.000Z',
      sessionsUtc: ['2030-11-01T21:00:00.000Z', '2030-11-22T21:00:00.000Z'],
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
});

describe('the reminder carries the local calendar date it belongs to', () => {
  it('reports the local date, not the UTC date, for an evening reminder', () => {
    // 20:00 in Los Angeles is 04:00 UTC the following day, so the UTC date
    // alone puts the calendar dot on the wrong day.
    const reminders = scheduleNeuroplasticityReminders({
      nowUtc: '2030-01-01T00:00:00.000Z',
      sessionsUtc: ['2030-01-01T18:00:00.000Z', '2030-01-20T18:00:00.000Z'],
      reflectionHour: 20,
      morningHour: 7,
      startAfterDays: 3,
      cadenceDays: 4,
      timeZone: 'America/Los_Angeles',
    });

    expect(reminders.length).toBeGreaterThan(0);
    reminders.forEach((reminder) => {
      const utcDate = reminder.atUtc.split('T')[0];
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
      }).format(new Date(reminder.atUtc));

      expect(reminder.localDate).toBe(localDate);

      if (localDate !== utcDate) {
        // Proves the two genuinely diverge, so localDate is doing real work.
        expect(reminder.localDate).not.toBe(utcDate);
      }
    });
  });

  it('reports the local date east of UTC as well', () => {
    // 07:00 in Tokyo is 22:00 UTC the previous day.
    const reminders = scheduleNeuroplasticityReminders({
      ...params,
      timeZone: 'Asia/Tokyo',
    });

    expect(reminders.length).toBeGreaterThan(0);
    reminders.forEach((reminder) => {
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
      }).format(new Date(reminder.atUtc));
      expect(reminder.localDate).toBe(localDate);
    });
  });
});
