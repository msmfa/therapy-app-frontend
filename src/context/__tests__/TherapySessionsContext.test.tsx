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

const { getTherapySessions } = jest.mocked(therapyModule);

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
});
