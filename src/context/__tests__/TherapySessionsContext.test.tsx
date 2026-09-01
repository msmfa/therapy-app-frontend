import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import * as therapyModule from '../../api/therapy';

let mockIsAuthenticated = true;

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

jest.mock('../../api/therapy', () => ({
  getTherapySessions: jest.fn(),
  syncTherapySessions: jest.fn(),
}));

const { getTherapySessions, syncTherapySessions } = jest.mocked(therapyModule);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('TherapySessionsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    getTherapySessions.mockResolvedValue([]);
    syncTherapySessions.mockResolvedValue({ created: 0, updated: 0, deleted: 0 });
  });

  it('dedupes concurrent refreshes into a single network request', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => {
      expect(getTherapySessions).toHaveBeenCalledTimes(1);
    });

    getTherapySessions.mockClear();

    const deferred = createDeferred<therapyModule.TherapySession[]>();
    getTherapySessions.mockImplementationOnce(() => deferred.promise);

    let firstRefresh!: Promise<void>;
    let secondRefresh!: Promise<void>;

    await act(async () => {
      firstRefresh = result.current.refreshSessions();
      secondRefresh = result.current.refreshSessions();
      await Promise.resolve();
    });

    expect(getTherapySessions).toHaveBeenCalledTimes(1);

    deferred.resolve([]);

    await act(async () => {
      await Promise.all([firstRefresh, secondRefresh]);
    });

    expect(getTherapySessions).toHaveBeenCalledTimes(1);
  });

  it('rejects a sync when the required post-save refresh fails', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(getTherapySessions).toHaveBeenCalledTimes(1));

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const refreshError = new Error('refresh failed');
    getTherapySessions.mockRejectedValueOnce(refreshError);

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.syncSessions(
          { '2026-09-02': new Date('2026-09-02T10:00:00.000Z') },
          50,
        );
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBe(refreshError);
    expect(syncTherapySessions).toHaveBeenCalledTimes(1);
    expect(result.current.error).not.toBeNull();
    consoleError.mockRestore();
  });

  it('performs a fresh GET after sync instead of reusing a pre-save refresh', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(getTherapySessions).toHaveBeenCalledTimes(1));

    const staleRefresh = createDeferred<therapyModule.TherapySession[]>();
    getTherapySessions.mockImplementationOnce(() => staleRefresh.promise);

    let staleRefreshPromise!: Promise<void>;
    let syncPromise!: Promise<void>;
    await act(async () => {
      staleRefreshPromise = result.current.refreshSessions();
      syncPromise = result.current.syncSessions(
        { '2026-09-02': new Date('2026-09-02T10:00:00.000Z') },
        50,
      );
      await Promise.resolve();
    });

    const firstSession = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const secondSession = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    const freshSessions: therapyModule.TherapySession[] = [
      { _id: 'fresh-1', startsAtUtc: firstSession.toISOString(), durationMin: 50 },
      { _id: 'fresh-2', startsAtUtc: secondSession.toISOString(), durationMin: 50 },
    ];
    getTherapySessions.mockResolvedValueOnce(freshSessions);

    staleRefresh.resolve([]);

    await act(async () => {
      await staleRefreshPromise;
      await syncPromise;
    });

    expect(getTherapySessions).toHaveBeenCalledTimes(3);
    expect(result.current.sessions).toEqual(freshSessions);
    // The reminder plan is no longer derived here, so its contents are not this
    // test's business any more; the fresh session list above is what the
    // schedule request is keyed on. Reminder behaviour is covered in
    // TherapySessionsContext.reminders.test.tsx.
  });
});
