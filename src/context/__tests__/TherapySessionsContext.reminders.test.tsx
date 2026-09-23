import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';

/**
 * The reminder plan is not computed in the app. It is the set of rows the
 * server will send pushes from, fetched with the calendar. These tests cover
 * the consequences: the calendar shows whatever the server said, a cold start
 * paints the last answer before the request lands, and the answer is refetched
 * when time has moved on (foreground, midnight) or a load failed.
 *
 * The scenario is the one that used to be broken: weekly Wednesday sessions,
 * "now" is the Monday in between, and the reminder still owed is the
 * pre_session one on the Tuesday evening. The app never sees the session that
 * has already happened, so it could not have derived that reminder itself.
 */
const NOW = new Date('2026-08-31T12:00:00.000Z');

const MOCK_SEP_1 = {
  id: 'r-sep-1', kind: 'review_note' as const, reason: Reason.PreSession,
  dueAtUtc: '2026-09-01T19:00:00.000Z', localDate: '2026-09-01', sessionId: 's0', nextSessionId: 's1',
  gapIndex: 0, status: 'pending' as const,
};
const MOCK_SEP_2 = {
  id: 'r-sep-2', kind: 'review_note' as const, reason: Reason.PostSession,
  dueAtUtc: '2026-09-02T19:00:00.000Z', localDate: '2026-09-02', sessionId: 's1', nextSessionId: 's2',
  gapIndex: 1, status: 'pending' as const,
};
const MOCK_AUG_30 = {
  id: 'r-aug-30', kind: 'log_note' as const,
  dueAtUtc: '2026-08-26T17:00:00.000Z', localDate: '2026-08-26', sessionId: 's0', status: 'sent' as const,
};

const MOCK_SESSIONS = [
  { _id: 's1', startsAtUtc: '2026-09-02T16:00:00.000Z', durationMin: 50 },
  { _id: 's2', startsAtUtc: '2026-09-09T16:00:00.000Z', durationMin: 50 },
];

const appStateListeners: Array<(state: string) => void> = [];

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'user-1' } }),
}));

jest.mock('../../api/therapy', () => ({
  getCalendar: jest.fn(async () => ({
    revision: 1,
    timeZone: 'Europe/London',
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
    sessions: MOCK_SESSIONS,
    series: [],
    reminders: [MOCK_AUG_30, MOCK_SEP_1, MOCK_SEP_2],
  })),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { getCalendar } from '../../api/therapy';
import { Reason } from '../../features/reminders/types';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

const mockGetCalendar = getCalendar as jest.MockedFunction<typeof getCalendar>;

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

describe('the reminder plan comes from the server', () => {
  beforeEach(async () => {
    appStateListeners.length = 0;
    mockGetCalendar.mockClear();
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

    expect(result.current.sessions.map((s) => s.startsAtUtc)).toEqual([
      '2026-09-02T16:00:00.000Z',
      '2026-09-09T16:00:00.000Z',
    ]);
    expect(result.current.neuroReminders.map((r) => r.localDate)).toEqual(['2026-09-01', '2026-09-02']);
    expect(result.current.reminderScheduleSettings).toEqual({
      timeZone: 'Europe/London',
      morningReminderMinutes: 450,
      eveningReminderMinutes: 1215,
    });
    expect(result.current.reminderScheduleStatus).toBe('ready');
  });

  it('keeps past rows for the calendar but out of the legacy review plan', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.reminders).toHaveLength(3));

    expect(result.current.reminders.map((r) => r.id)).toContain('r-aug-30');
    expect(result.current.neuroReminders.map((r) => r.localDate)).not.toContain('2026-08-26');
    expect(result.current.nextReminder?.id).toBe('r-sep-1');
  });

  it('paints the last known calendar before the request answers, then replaces it', async () => {
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.reminders).toHaveLength(3));
    first.unmount();

    let answer!: (value: Awaited<ReturnType<typeof getCalendar>>) => void;
    mockGetCalendar.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));

    const second = renderHook(() => useTherapySessions(), { wrapper });
    // Cached: the dots are there while the request is still in flight.
    await waitFor(() => expect(second.result.current.reminders).toHaveLength(3));
    expect(second.result.current.hydrated).toBe(true);
    expect(mockGetCalendar).toHaveBeenCalledTimes(2);

    await act(async () => {
      answer({
        revision: 2, timeZone: 'Europe/London', morningReminderMinutes: 450, eveningReminderMinutes: 1215,
        sessions: MOCK_SESSIONS, series: [], reminders: [MOCK_SEP_2],
      });
    });
    expect(second.result.current.reminders.map((r) => r.id)).toEqual(['r-sep-2']);
    expect(second.result.current.revision).toBe(2);
  });

  it('refetches on every return to the foreground', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.reminders.length).toBeGreaterThan(0));
    expect(mockGetCalendar).toHaveBeenCalledTimes(1);

    foreground();
    await waitFor(() => expect(mockGetCalendar).toHaveBeenCalledTimes(2));
  });

  it('keeps the last known calendar when the refresh fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(first.result.current.reminders.length).toBeGreaterThan(0));
    first.unmount();

    mockGetCalendar.mockRejectedValueOnce(new Error('offline'));
    const second = renderHook(() => useTherapySessions(), { wrapper });

    // An empty calendar would be worse than one that is a little stale.
    await waitFor(() => expect(second.result.current.reminderScheduleStatus).toBe('error'));
    expect(second.result.current.neuroReminders.map((r) => r.localDate)).toContain('2026-09-01');
    expect(second.result.current.error).not.toBeNull();
    consoleError.mockRestore();
  });

  it('refetches at local midnight even when nothing else moved', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.reminders.length).toBeGreaterThan(0));
    expect(mockGetCalendar).toHaveBeenCalledTimes(1);

    // Reminders pass and the next one moves on without any edit in the app.
    await act(async () => {
      jest.advanceTimersByTime(13 * 60 * 60 * 1000);
    });
    await waitFor(() => expect(mockGetCalendar).toHaveBeenCalledTimes(2));
  });
});
