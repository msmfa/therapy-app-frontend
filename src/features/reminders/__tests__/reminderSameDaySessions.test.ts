import { describe, expect, it } from '@jest/globals';
import { Reason, scheduleNeuroplasticityReminders } from '../reminder-schedule-v2';

/**
 * The plan this scheduler produces is what the app shows, so it has to agree
 * with the backend cron. Mirrors the backend's reminderDayCap assertions.
 */
const ZONE = 'Europe/London';
const DURATION_MIN = 50;

const schedule = (starts: string[]) =>
  scheduleNeuroplasticityReminders({
    nowUtc: '2026-09-01T00:00:00.000Z',
    sessionsUtc: starts,
    reflectionHour: 20,
    morningHour: 7,
    startAfterDays: 3,
    cadenceDays: 4,
    timeZone: ZONE,
    sessionDurationsMin: Object.fromEntries(starts.map((s) => [s, DURATION_MIN])),
  });

// 10:00 and 16:00 local on the same day, then a session the following week.
const SAME_DAY = [
  '2026-09-02T09:00:00.000Z',
  '2026-09-02T15:00:00.000Z',
  '2026-09-09T09:00:00.000Z',
];

describe('two sessions on one day', () => {
  // The evening reminder used to be dragged back to a minute before the second
  // session, so "review today's notes" was shown as the user was about to walk
  // into their next appointment.
  it('never places a reminder in the minute before the next session', () => {
    for (const reminder of schedule(SAME_DAY)) {
      const at = new Date(reminder.atUtc).getTime();
      for (const start of SAME_DAY) {
        const sessionStart = new Date(start).getTime();
        const isJustBefore = at < sessionStart && sessionStart - at <= 60_000;
        expect(isJustBefore).toBe(false);
      }
    }
  });

  it('shows at most one reminder on the day holding both sessions', () => {
    const onTheDay = schedule(SAME_DAY).filter((r) => r.localDate === '2026-09-02');

    expect(onTheDay.length).toBeLessThanOrEqual(1);
  });

  it('keeps the reminder it does show clear of both sessions', () => {
    const secondSessionEnds =
      new Date('2026-09-02T15:00:00.000Z').getTime() + DURATION_MIN * 60_000;

    for (const reminder of schedule(SAME_DAY).filter((r) => r.localDate === '2026-09-02')) {
      expect(new Date(reminder.atUtc).getTime()).toBeGreaterThanOrEqual(secondSessionEnds);
    }
  });
});

describe('the ordinary weekly schedule is unaffected', () => {
  it('still shows the evening reminder at the reflection hour', () => {
    const reminders = schedule(['2026-09-02T13:00:00.000Z', '2026-09-09T13:00:00.000Z']);
    const postSession = reminders.find((r) => r.reason === Reason.PostSession);

    expect(postSession).toBeDefined();
    const hour =
      Number(
        new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: '2-digit', hour12: false }).format(
          new Date(postSession!.atUtc),
        ),
      ) % 24;
    expect(hour).toBe(20);
  });
});
