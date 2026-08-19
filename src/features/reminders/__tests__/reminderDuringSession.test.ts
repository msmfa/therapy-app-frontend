import { describe, expect, it } from '@jest/globals';
import { Reason, scheduleNeuroplasticityReminders } from '../reminder-schedule-v2';

/**
 * The plan this scheduler produces is what the app shows the user, so it has
 * to agree with the backend cron. Mirrors the backend's reminderDuringSession
 * assertions.
 */
const ZONE = 'Europe/London';
const DURATION_MIN = 50;

const schedule = (starts: string[]) =>
  scheduleNeuroplasticityReminders({
    nowUtc: '2026-08-19T08:00:00.000Z',
    sessionsUtc: starts,
    reflectionHour: 20,
    morningHour: 7,
    startAfterDays: 3,
    cadenceDays: 4,
    timeZone: ZONE,
    sessionDurationsMin: Object.fromEntries(starts.map((s) => [s, DURATION_MIN])),
  });

const postSession = (starts: string[]) =>
  schedule(starts).find((r) => r.reason === Reason.PostSession);

const localHour = (iso: string) =>
  Number(
    new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: '2-digit', hour12: false }).format(
      new Date(iso),
    ),
  ) % 24;

describe('post-session reminder is never shown during the session', () => {
  it('still lands on the reflection hour for an afternoon session', () => {
    const reminder = postSession(['2026-08-19T13:00:00.000Z', '2026-08-26T13:00:00.000Z']);

    expect(reminder).toBeDefined();
    expect(localHour(reminder!.atUtc)).toBe(20);
  });

  // 19:30 + 50 min runs to 20:20, straight through the 20:00 reflection hour.
  it('is dropped when the session is still running at the reflection hour', () => {
    expect(postSession(['2026-08-19T18:30:00.000Z', '2026-08-26T18:30:00.000Z'])).toBeUndefined();
  });

  // A 21:00 session starts after the reflection hour entirely; the old clamp
  // pulled the reminder back to one minute past the start.
  it('is dropped when the session starts after the reflection hour', () => {
    expect(postSession(['2026-08-19T20:00:00.000Z', '2026-08-26T20:00:00.000Z'])).toBeUndefined();
  });

  it('never places any reminder inside the session it follows', () => {
    const start = '2026-08-19T20:00:00.000Z';
    const sessionEndsAt = new Date(start).getTime() + DURATION_MIN * 60_000;

    for (const reminder of schedule([start, '2026-08-26T20:00:00.000Z'])) {
      expect(new Date(reminder.atUtc).getTime()).toBeGreaterThanOrEqual(sessionEndsAt);
    }
  });

  it('still shows the morning reminder after a late session', () => {
    const reminders = schedule(['2026-08-19T20:00:00.000Z', '2026-08-26T20:00:00.000Z']);

    expect(reminders.some((r) => r.reason === Reason.PostSleep)).toBe(true);
  });
});
