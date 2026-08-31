import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';

/**
 * Reminders are derived from the gap between two consecutive sessions, so the
 * ones still owed before the next session depend on the session that already
 * happened. Fetching from today onwards dropped that session, the current gap
 * could not be formed, and every remaining reminder in it disappeared from the
 * calendar the morning after each session — while the cron, which reads every
 * session the user has, went on sending those same pushes.
 *
 * Weekly Wednesday sessions, "now" is the Monday in between, so the only
 * reminder left in the current gap is the pre_session one on the Tuesday.
 */
const LAST_SESSION = '2026-08-26T16:00:00.000Z';
const NEXT_SESSION = '2026-09-02T16:00:00.000Z';
const LATER_SESSION = '2026-09-09T16:00:00.000Z';

const NOW = new Date('2026-08-31T12:00:00.000Z');

let requestedFrom: Date | null = null;

jest.mock('../../hooks/useTimeZoneSync', () => ({
  getDeviceTimeZone: () => 'Europe/London',
  useTimeZoneSync: () => undefined,
}));

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../api/therapy', () => {
  const actual = jest.requireActual('../../api/therapy') as Record<string, unknown>;
  const ALL = [
    { _id: 's0', startsAtUtc: LAST_SESSION, durationMin: 50 },
    { _id: 's1', startsAtUtc: NEXT_SESSION, durationMin: 50 },
    { _id: 's2', startsAtUtc: LATER_SESSION, durationMin: 50 },
  ];

  return {
    ...actual,
    // Stands in for the backend's `startsAtUtc: { $gte: from, $lt: to }`.
    getTherapySessions: jest.fn(async (from: Date, to: Date) => {
      requestedFrom = from;
      const { fromUTC, toUTC } = (actual.toUtcDayRange as typeof import('../../api/therapy').toUtcDayRange)(from, to);
      return ALL.filter((session) => {
        const at = new Date(session.startsAtUtc).getTime();
        return at >= fromUTC.getTime() && at < toUTC.getTime();
      });
    }),
    syncTherapySessions: jest.fn(),
  };
});

import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

describe('reminders still owed in the current gap', () => {
  beforeEach(() => {
    requestedFrom = null;
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the pre-session reminder that sits between the last and next session', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(result.current.neuroReminders.length).toBeGreaterThan(0));

    const days = result.current.neuroReminders.map((reminder) => reminder.localDate);

    // 20:00 London on the evening before the 2 Sep session.
    expect(days).toContain('2026-09-01');
    expect(result.current.neuroReminders[0]).toMatchObject({
      localDate: '2026-09-01',
      reason: 'pre_session',
      atUtc: '2026-09-01T19:00:00.000Z',
    });
  });

  it('reads back past the editable window so the current gap can be formed', async () => {
    renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(requestedFrom).not.toBeNull());
    expect(requestedFrom!.getTime()).toBeLessThan(new Date(LAST_SESSION).getTime());
  });

  it('still exposes only today-onwards sessions for editing', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(result.current.sessions.length).toBeGreaterThan(0));

    // The past session feeds the reminder schedule but must not become
    // editable, or the sync would resubmit and re-date it.
    expect(result.current.sessions.map((s) => s.startsAtUtc)).toEqual([
      NEXT_SESSION,
      LATER_SESSION,
    ]);
  });
});
