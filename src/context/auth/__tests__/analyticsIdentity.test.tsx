import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

const mockStored: Record<string, string> = {};
const mockSetIdentity = jest.fn();
jest.mock('../../../features/analytics/client', () => ({ analytics: { setIdentity: (id: string | null) => mockSetIdentity(id) } }));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async (key: string) => mockStored[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { mockStored[key] = value; }),
    deleteItemAsync: jest.fn(async (key: string) => { delete mockStored[key]; }),
}));
jest.mock('../../../api/auth', () => ({ refreshAuthToken: jest.fn() }));
import { refreshAuthToken } from '../../../api/auth';
import { AuthProvider, useAuth } from '../AuthContext';
const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const userA = { id: 'backend-a', email: 'a@example.com', name: 'A' };
const userB = { id: 'backend-b', email: 'b@example.com', name: 'B' };
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; };
beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStored).forEach((key) => { delete mockStored[key]; });
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => mockStored[key] ?? null);
    jest.mocked(refreshAuthToken).mockResolvedValue({ token: 'refreshed', user: userA });
});

test('hydration identifies canonical persisted account only after auth resolves, with no temporary anonymous reset', async () => {
    const gate = deferred<void>();
    Object.assign(mockStored, { token: 'token-a', refreshToken: 'refresh-a', user: JSON.stringify(userA) });
    jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => { await gate.promise; return mockStored[key] ?? null; });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(mockSetIdentity).not.toHaveBeenCalled();
    await act(async () => { gate.resolve(); });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(mockSetIdentity.mock.calls).toEqual([['backend-a']]);
    await act(async () => { await result.current.refreshSession(); });
    expect(mockSetIdentity.mock.calls).toEqual([['backend-a']]);
});

test('logout revokes identity before bounded cleanup; same account login restores canonical ID', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => { await result.current.setAuth('a', userA, 'refresh-a'); });
    const cleanup = deferred<void>();
    result.current.registerSignOutTask(() => cleanup.promise);
    mockSetIdentity.mockClear();
    let logout!: Promise<void>;
    act(() => { logout = result.current.signOut(); });
    expect(mockSetIdentity.mock.calls).toEqual([[null]]);
    expect(result.current.user?.id).toBe('backend-a');
    await act(async () => { cleanup.resolve(); await logout; });
    expect(mockSetIdentity.mock.calls).toEqual([[null]]);
    await act(async () => { await result.current.setAuth('a-again', userA, 'refresh-new'); });
    expect(mockSetIdentity).toHaveBeenLastCalledWith('backend-a');
    expect(JSON.stringify(mockSetIdentity.mock.calls)).not.toContain('example.com');
});

test('late A refresh and logout completion cannot reset B identity', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => { await result.current.setAuth('a', userA, 'refresh-a'); });
    const response = deferred<Awaited<ReturnType<typeof refreshAuthToken>>>();
    jest.mocked(refreshAuthToken).mockReturnValueOnce(response.promise);
    result.current.registerSignOutTask(async () => undefined);
    let logout!: Promise<void>;
    act(() => { logout = result.current.signOut(); });
    await act(async () => { await result.current.setAuth('b', userB, 'refresh-b'); });
    mockSetIdentity.mockClear();
    await act(async () => { response.resolve({ token: 'late-a', user: userA }); await logout; });
    expect(mockSetIdentity).not.toHaveBeenCalled();
    expect(result.current.user?.id).toBe('backend-b');
});

test('genuine empty persisted session enables only anonymous identity after hydration outcome', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(mockSetIdentity.mock.calls).toEqual([[null]]);
});
