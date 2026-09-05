import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';

/**
 * The schedule is no longer computed in the app. It is computed once, by the
 * same server code that sends the pushes, and fetched. These tests cover the
 * consequences of that: the calendar shows whatever the server said, the answer
 * is cached because it only moves when the sessions move, and travel or a
 * session edit invalidates it.
 *
 * The scenario is the one that was broken: weekly Wednesday sessions, "now" is
 * the Monday in between, and the reminder still owed is the pre_session one on
 * the Tuesday evening. The app never sees the session that has already
 * happened, so it could not have derived that reminder itself.
 */
const NOW = new Date('2026-08-31T12:00:00.000Z');

const SEP_1 = {
  atUtc: '2026-09-01T19:00:00.000Z',
  localDate: '2026-09-01',
  reason: 'pre_session',
  gapIndex: 0,
};
const SEP_2 = {
  atUtc: '2026-09-02T19:00:00.000Z',
  localDate: '2026-09-02',
  reason: 'post_session',
  gapIndex: 1,
};

const FUTURE_SESSIONS = [
  { _id: 's1', startsAtUtc: '2026-09-02T16:00:00.000Z', durationMin: 50 },
  { _id: 's2', startsAtUtc: '2026-09-09T16:00:00.000Z', durationMin: 50 },
];

let mockZone = 'Europe/London';
let mockSessions = FUTURE_SESSIONS;
const appStateListeners: Array<(state: string) => void> = [];

jest.mock('../../hooks/useTimeZoneSync', () => ({
  getDeviceTimeZone: () => mockZone,
  useTimeZoneSync: () => undefined,
}));

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'user-1' } }),
}));

jest.mock('../../api/therapy', () => ({
  ...(jest.requireActual('../../api/therapy') as Record<string, unknown>),
  getTherapySessions: jest.fn(async () => mockSessions),
  syncTherapySessions: jest.fn(),
}));

jest.mock('../../api/reminders', () => ({
  getReminders: jest.fn(async () => ({
    timeZone: 'Europe/London',
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
    reminders: [SEP_1, SEP_2],
  })),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getReminders } from '../../api/reminders';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

const mockGetReminders = getReminders as jest.MockedFunction<typeof getReminders>;

// Spy rather than mock the module: replacing react-native wholesale breaks
// the jest-expo preset.
jest.spyOn(AppState, 'addEventListener').mockImplementation(
  ((_event: string, handler: (state: string) => void) => {
    appStateListeners.push(handler);
    return {
      remove: () => {
        const index = appStateListeners.indexOf(handler);
        if (index >= 0) appStateListeners.splice(index, 1);
      },
    };
  }) as never,
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

const foreground = () => {
  act(() => {
    appStateListeners.forEach((listener) => listener('active'));
  });
};

describe('reminder schedule comes from the server', () => {
  beforeEach(async () => {
    appStateListeners.length = 0;
    mockZone = 'Europe/London';
    mockSessions = FUTURE_SESSIONS;
    mockGetReminders.mockClear();
    await AsyncStorage.clear();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a reminder the app could not have derived from the sessions it holds', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(result.current.neuroReminders.length).toBeGreaterThan(0));

    // The sessions on hand start on 2 Sep, so a locally computed schedule could
    // never place anything on 1 Sep.
    expect(result.current.sessions.map((s) => s.startsAtUtc)).toEqual([
      '2026-09-02T16:00:00.000Z',
      '2026-09-09T16:00:00.000Z',
    ]);
    expect(result.current.neuroReminders.map((r) => r.localDate)).toContain('2026-09-01');
    expect(result.current.reminderScheduleSettings).toEqual({
      timeZone: 'Europe/London',
      morningReminderMinutes: 450,
      eveningReminderMinutes: 1215,
    });
  });

  it('serves a second mount from the cache instead of refetching', async () => {
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.neuroReminders.length).toBeGreaterThan(0));
    expect(mockGetReminders).toHaveBeenCalledTimes(1);

    first.unmount();

    const second = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(second.result.current.neuroReminders.length).toBeGreaterThan(0));

    // Same sessions, same zone, same day: nothing the server could tell us has
    // changed.
    expect(mockGetReminders).toHaveBeenCalledTimes(1);
    expect(second.result.current.neuroReminders.map((r) => r.localDate)).toContain('2026-09-01');
  });

  it('refetches when the user changes a session', async () => {
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.neuroReminders.length).toBeGreaterThan(0));
    expect(mockGetReminders).toHaveBeenCalledTimes(1);
    first.unmount();

    // The user moves their Wednesday session to the Thursday.
    mockSessions = [
      { _id: 's1', startsAtUtc: '2026-09-03T16:00:00.000Z', durationMin: 50 },
      { _id: 's2', startsAtUtc: '2026-09-09T16:00:00.000Z', durationMin: 50 },
    ];

    const second = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(mockGetReminders).toHaveBeenCalledTimes(2));
    expect(second.result.current.neuroReminders.length).toBeGreaterThan(0);
  });

  it('refetches when the device zone changes, and not when it is unchanged', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.neuroReminders.length).toBeGreaterThan(0));
    expect(mockGetReminders).toHaveBeenCalledTimes(1);

    // Same zone, repeated foregrounding: the schedule must not churn.
    foreground();
    foreground();
    await waitFor(() => expect(mockGetReminders).toHaveBeenCalledTimes(1));

    // The user flies London -> New York. Same sessions, different wall clock,
    // so the instants the server resolves them to are no longer the cached
    // ones.
    mockZone = 'America/New_York';
    foreground();

    await waitFor(() => expect(mockGetReminders).toHaveBeenCalledTimes(2));
  });

  it('keeps the last known schedule when the refresh fails', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.neuroReminders.length).toBeGreaterThan(0));
    first.unmount();

    // Force a cache miss, then fail the request behind it.
    mockSessions = [
      { _id: 's1', startsAtUtc: '2026-09-04T16:00:00.000Z', durationMin: 50 },
      { _id: 's2', startsAtUtc: '2026-09-11T16:00:00.000Z', durationMin: 50 },
    ];
    mockGetReminders.mockRejectedValueOnce(new Error('offline'));

    const second = renderHook(() => useTherapySessions(), { wrapper });

    // An empty calendar would be worse than a schedule that is a little stale.
    await waitFor(() => expect(second.result.current.neuroReminders.length).toBeGreaterThan(0));
    expect(second.result.current.neuroReminders.map((r) => r.localDate)).toContain('2026-09-01');
    await waitFor(() => expect(warning).toHaveBeenCalledWith(
      '[Reminders] Failed to load reminder schedule:',
      expect.any(Error),
    ));
    warning.mockRestore();
  });

  it('refetches on a new day even when nothing else moved', async () => {
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.neuroReminders.length).toBeGreaterThan(0));
    expect(mockGetReminders).toHaveBeenCalledTimes(1);
    first.unmount();

    // Reminders drop out of the schedule as they pass, so a cached answer is
    // only good for the day it was fetched on.
    jest.setSystemTime(new Date('2026-09-01T09:00:00.000Z'));

    renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(mockGetReminders).toHaveBeenCalledTimes(2));
  });
});
