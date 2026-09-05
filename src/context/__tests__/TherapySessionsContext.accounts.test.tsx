import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

let mockAuth = { isAuthenticated: true, user: { id: 'user-a' } as { id: string } | null };
jest.mock('../auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../api/therapy', () => ({ getTherapySessions: jest.fn(), syncTherapySessions: jest.fn() }));
jest.mock('../../features/reminders/useNeuroReminders', () => ({ useNeuroReminders: () => [] }));

import { getTherapySessions, syncTherapySessions, type TherapySession } from '../../api/therapy';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <TherapySessionsProvider>{children}</TherapySessionsProvider>;
const sessionA: TherapySession = {
    _id: 'account-a-private-session',
    startsAtUtc: new Date(Date.now() + 86400000).toISOString(),
    durationMin: 50,
};
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getTherapySessions).mockReset();
    jest.mocked(syncTherapySessions).mockReset();
    mockAuth = { isAuthenticated: true, user: { id: 'user-a' } };
});

it('discards account A data while account B has its own pending request', async () => {
    const requestA = deferred<TherapySession[]>();
    const requestB = deferred<TherapySession[]>();
    jest.mocked(getTherapySessions).mockReturnValueOnce(requestA.promise).mockReturnValueOnce(requestB.promise);
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    mockAuth = { isAuthenticated: false, user: null };
    rerender({});
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});
    expect(getTherapySessions).toHaveBeenCalledTimes(2);

    await act(async () => { requestA.resolve([sessionA]); });
    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(true);

    const sessionB = { ...sessionA, _id: 'account-b-session' };
    await act(async () => { requestB.resolve([sessionB]); });
    expect(result.current.sessions).toEqual([sessionB]);
    expect(result.current.loading).toBe(false);
});

it('immediately hides loaded data when switching accounts without an intermediate logout', async () => {
    const requestB = deferred<TherapySession[]>();
    jest.mocked(getTherapySessions).mockResolvedValueOnce([sessionA]).mockReturnValueOnce(requestB.promise);
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.sessions).toEqual([sessionA]));
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});

    expect(result.current.sessions).toEqual([]);
    expect(result.current.scheduleSessions).toEqual([]);
    expect(result.current.nextSession).toBeNull();
    await act(async () => { requestB.resolve([]); });
});

it('does not submit an old account edit after its prerequisite load finishes in a new session', async () => {
    const requestA = deferred<TherapySession[]>();
    jest.mocked(getTherapySessions).mockReturnValueOnce(requestA.promise).mockResolvedValue([]);
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    const pendingEdit = result.current.syncSessions({ selected: new Date(sessionA.startsAtUtc) }, 50);
    const rejected = expect(pendingEdit).rejects.toThrow('Session changed');
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});
    await act(async () => { requestA.resolve([sessionA]); await rejected; });

    expect(syncTherapySessions).not.toHaveBeenCalled();
});
