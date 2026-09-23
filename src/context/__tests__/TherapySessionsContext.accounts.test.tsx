import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

let mockAuth = { isAuthenticated: true, user: { id: 'user-a' } as { id: string } | null };
jest.mock('../auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../api/therapy', () => ({
    getCalendar: jest.fn(), createSession: jest.fn(), updateSession: jest.fn(), deleteSession: jest.fn(),
}));

import { createSession, getCalendar, type CalendarSnapshot, type TherapySession } from '../../api/therapy';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <TherapySessionsProvider>{children}</TherapySessionsProvider>;
const sessionA: TherapySession = {
    _id: 'account-a-private-session',
    startsAtUtc: new Date(Date.now() + 86400000).toISOString(),
    durationMin: 50,
};
const calendar = (sessions: TherapySession[]): CalendarSnapshot => ({
    revision: 1, timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200,
    sessions, series: [], reminders: [],
});
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCalendar).mockReset();
    jest.mocked(createSession).mockReset();
    mockAuth = { isAuthenticated: true, user: { id: 'user-a' } };
});

it('discards account A data while account B has its own pending request', async () => {
    const requestA = deferred<CalendarSnapshot>();
    const requestB = deferred<CalendarSnapshot>();
    jest.mocked(getCalendar).mockReturnValueOnce(requestA.promise).mockReturnValueOnce(requestB.promise);
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    mockAuth = { isAuthenticated: false, user: null };
    rerender({});
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});
    expect(getCalendar).toHaveBeenCalledTimes(2);

    await act(async () => { requestA.resolve(calendar([sessionA])); });
    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(true);

    const sessionB = { ...sessionA, _id: 'account-b-session' };
    await act(async () => { requestB.resolve(calendar([sessionB])); });
    expect(result.current.sessions).toEqual([sessionB]);
    expect(result.current.loading).toBe(false);
});

it('immediately hides loaded data when switching accounts without an intermediate logout', async () => {
    const requestB = deferred<CalendarSnapshot>();
    jest.mocked(getCalendar).mockResolvedValueOnce(calendar([sessionA])).mockReturnValueOnce(requestB.promise);
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.sessions).toEqual([sessionA]));
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});

    expect(result.current.sessions).toEqual([]);
    expect(result.current.scheduleSessions).toEqual([]);
    expect(result.current.reminders).toEqual([]);
    expect(result.current.nextSession).toBeNull();
    expect(result.current.revision).toBeNull();
    await act(async () => { requestB.resolve(calendar([])); });
});

it('does not submit an old account edit after its prerequisite load finishes in a new session', async () => {
    const requestA = deferred<CalendarSnapshot>();
    jest.mocked(getCalendar).mockReturnValueOnce(requestA.promise).mockResolvedValue(calendar([]));
    const { result, rerender } = renderHook(() => useTherapySessions(), { wrapper });
    const pendingEdit = result.current.addSeries({
        firstSessionAt: new Date(sessionA.startsAtUtc), cadence: 'weekly', durationMin: 50,
    });
    const rejected = expect(pendingEdit).rejects.toThrow('Session changed');
    mockAuth = { isAuthenticated: true, user: { id: 'user-b' } };
    rerender({});
    await act(async () => { requestA.resolve(calendar([sessionA])); await rejected; });

    expect(createSession).not.toHaveBeenCalled();
});
