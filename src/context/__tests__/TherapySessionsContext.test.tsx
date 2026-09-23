import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import * as therapyModule from '../../api/therapy';
import { ApiError } from '../../api/client';
import { getSessionsWindow } from '../../utils/sessionWindow';

let mockIsAuthenticated = true;

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: { id: 'user-1' },
  }),
}));

jest.mock('../../api/therapy', () => ({
  getCalendar: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
}));

const { getCalendar, createSession, updateSession, deleteSession } = jest.mocked(therapyModule);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

const DAY_MS = 24 * 60 * 60 * 1000;

const calendar = (
  sessions: therapyModule.TherapySession[] = [],
  revision = 1,
): therapyModule.CalendarSnapshot => ({
  revision,
  timeZone: 'UTC',
  morningReminderMinutes: 420,
  eveningReminderMinutes: 1200,
  sessions,
  series: [],
  reminders: [],
});

const session = (id: string, at: Date, extra: Partial<therapyModule.TherapySession> = {}): therapyModule.TherapySession =>
  ({ _id: id, startsAtUtc: at.toISOString(), durationMin: 50, ...extra });

const written = (id = 'new'): therapyModule.SessionWriteResult => ({
  revision: 2,
  session: session(id, new Date(Date.now() + DAY_MS)),
  created: 1,
});

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('TherapySessionsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    getCalendar.mockResolvedValue(calendar());
    createSession.mockResolvedValue(written());
    updateSession.mockResolvedValue({ revision: 2, session: written().session });
    deleteSession.mockResolvedValue({ revision: 2, deleted: 1 });
  });

  it('dedupes concurrent refreshes into a single network request', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));
    getCalendar.mockClear();

    const deferred = createDeferred<therapyModule.CalendarSnapshot>();
    getCalendar.mockImplementationOnce(() => deferred.promise);

    let firstRefresh!: Promise<void>;
    let secondRefresh!: Promise<void>;
    await act(async () => {
      firstRefresh = result.current.refreshSessions();
      secondRefresh = result.current.refreshSessions();
      await Promise.resolve();
    });
    expect(getCalendar).toHaveBeenCalledTimes(1);

    deferred.resolve(calendar());
    await act(async () => { await Promise.all([firstRefresh, secondRefresh]); });
    expect(getCalendar).toHaveBeenCalledTimes(1);
  });

  it.each(['before', 'after', 'invalid'] as const)('rejects an appointment %s the editable range without a request', async (position) => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const window = getSessionsWindow();
    const startsAtUtc = position === 'invalid' ? new Date(NaN)
      : new Date(position === 'before' ? window.from.getTime() - 1 : window.to.getTime() + 1);

    await act(async () => {
      await expect(result.current.addSession({ startsAtUtc })).rejects.toThrow('Appointments must be between today and one year ahead');
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('commits an appointment with the revision it last saw, then fetches the calendar the server now holds', async () => {
    getCalendar.mockResolvedValueOnce(calendar([], 7));
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.revision).toBe(7));
    const added = session('added', new Date(Date.now() + 3 * DAY_MS), { seriesId: 'ser' });
    getCalendar.mockResolvedValueOnce(calendar([added], 8));

    const at = new Date(Date.now() + 3 * DAY_MS);
    await act(async () => {
      await result.current.addSession({ startsAtUtc: at, durationMin: 50, repeat: 'weekly' });
    });

    expect(createSession).toHaveBeenCalledWith({ startsAtUtc: at, durationMin: 50, repeat: 'weekly' }, 7);
    expect(getCalendar).toHaveBeenCalledTimes(2);
    expect(result.current.sessions).toEqual([added]);
    expect(result.current.revision).toBe(8);
  });

  it('performs a fresh GET after a write instead of reusing a pre-write refresh', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));

    const staleRefresh = createDeferred<therapyModule.CalendarSnapshot>();
    const fresh = [session('fresh-1', new Date(Date.now() + DAY_MS)), session('fresh-2', new Date(Date.now() + 8 * DAY_MS))];
    getCalendar
      .mockImplementationOnce(() => staleRefresh.promise)
      .mockResolvedValueOnce(calendar(fresh, 3));

    let staleRefreshPromise!: Promise<void>;
    let writePromise!: Promise<unknown>;
    await act(async () => {
      staleRefreshPromise = result.current.refreshSessions();
      writePromise = result.current.addSession({ startsAtUtc: new Date(Date.now() + DAY_MS) });
      await writePromise;
    });
    expect(result.current.sessions).toEqual(fresh);

    // The pre-write answer lands last and must not undo what the write fetched.
    staleRefresh.resolve(calendar([], 1));
    await act(async () => { await staleRefreshPromise; });

    expect(getCalendar).toHaveBeenCalledTimes(3);
    expect(result.current.sessions).toEqual(fresh);
    expect(result.current.revision).toBe(3);
  });

  it('rejects a write when the required post-write refresh fails', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const refreshError = new Error('refresh failed');
    getCalendar.mockRejectedValueOnce(refreshError);

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.removeSession('gone', 'future');
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBe(refreshError);
    expect(deleteSession).toHaveBeenCalledWith('gone', 'future', 1);
    expect(result.current.error).not.toBeNull();
    consoleError.mockRestore();
  });

  it('refreshes before rethrowing an edit the server refused as stale', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));
    const refused = new ApiError(412, { message: 'changed', code: 'calendar_changed' });
    updateSession.mockRejectedValueOnce(refused);
    const remote = session('remote', new Date(Date.now() + 2 * DAY_MS));
    getCalendar.mockResolvedValueOnce(calendar([remote], 5));

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.updateSession('x', { startsAtUtc: new Date(Date.now() + DAY_MS), scope: 'this' });
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBe(refused);
    // The user is looking at the calendar that beat them by the time the
    // alert about it appears.
    expect(result.current.sessions).toEqual([remote]);
    expect(result.current.revision).toBe(5);
  });

  it('waits for the initial calendar before onboarding adds a series, and keeps an existing session on that day', async () => {
    const existingAt = new Date(Date.now() + 2 * DAY_MS);
    existingAt.setHours(9, 0, 0, 0);
    const proposedAt = new Date(existingAt);
    proposedAt.setHours(16);
    const existing = session('existing', existingAt, { durationMin: 60 });
    const initial = createDeferred<therapyModule.CalendarSnapshot>();
    getCalendar.mockImplementationOnce(() => initial.promise);

    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));

    let addPromise!: Promise<void>;
    await act(async () => {
      addPromise = result.current.addSeries({ firstSessionAt: proposedAt, cadence: 'weekly', durationMin: 50 });
      await Promise.resolve();
    });
    // Deciding against an empty list the first GET is about to replace was
    // the destructive race. Nothing may be written until it resolves.
    expect(createSession).not.toHaveBeenCalled();

    initial.resolve(calendar([existing], 1));
    getCalendar.mockResolvedValueOnce(calendar([existing, session('added', new Date(proposedAt.getTime() + 7 * DAY_MS))], 2));
    await act(async () => { await addPromise; });

    // The series starts a week later: the day the user named already has its
    // appointment, and that one is kept rather than replaced.
    expect(createSession).toHaveBeenCalledTimes(1);
    const [input, revision] = createSession.mock.calls[0];
    expect(input.repeat).toBe('weekly');
    expect(input.startsAtUtc.getTime()).toBe(proposedAt.getTime() + 7 * DAY_MS);
    expect(revision).toBe(1);
    expect(result.current.nextSession?._id).toBe('existing');
  });

  it('adds nothing when a one-off onboarding session lands on an occupied day', async () => {
    const existingAt = new Date(Date.now() + 2 * DAY_MS);
    getCalendar.mockResolvedValue(calendar([session('existing', existingAt)]));
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    await act(async () => {
      await result.current.addSeries({ firstSessionAt: existingAt, cadence: 'varies', durationMin: 50 });
    });

    expect(createSession).not.toHaveBeenCalled();
  });
});
