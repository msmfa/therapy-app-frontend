import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

const mockStored: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async (key: string) => mockStored[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { mockStored[key] = value; }),
    deleteItemAsync: jest.fn(async (key: string) => { delete mockStored[key]; }),
}));
jest.mock('../../api/auth', () => ({ refreshAuthToken: jest.fn() }));

import { refreshAuthToken } from '../../api/auth';
import { AuthProvider, useAuth } from '../auth/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const userA = { id: 'user-a', email: 'a@example.com', name: 'A' };
const userB = { id: 'user-b', email: 'b@example.com', name: 'B' };
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};

beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStored).forEach(key => { delete mockStored[key]; });
});

it.each(['logout', 'another login'] as const)(
    'ignores a refresh that finishes after %s',
    async (action) => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        await act(async () => { await result.current.setAuth('access-a', userA, 'refresh-a'); });
        const response = deferred<Awaited<ReturnType<typeof refreshAuthToken>>>();
        jest.mocked(refreshAuthToken).mockReturnValueOnce(response.promise);
        let pending!: Promise<boolean>;
        act(() => { pending = result.current.refreshSession(); });

        await act(async () => {
            if (action === 'logout') await result.current.signOut();
            else await result.current.setAuth('access-b', userB, 'refresh-b');
        });
        await act(async () => {
            response.resolve({ token: 'late-access-a', refreshToken: 'late-refresh-a', user: userA });
            expect(await pending).toBe(false);
        });

        expect(result.current.token).toBe(action === 'logout' ? null : 'access-b');
        expect(result.current.user).toEqual(action === 'logout' ? null : userB);
        expect(mockStored.token).toBe(action === 'logout' ? undefined : 'access-b');
        expect(mockStored.refreshToken).toBe(action === 'logout' ? undefined : 'refresh-b');
    },
);

it('clears an already-started keychain write before logout completes', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    const write = deferred<void>();
    jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (key, value) => {
        await write.promise;
        mockStored[key] = value;
    });
    let login!: Promise<void>;
    act(() => { login = result.current.setAuth('access-a', userA, 'refresh-a'); });
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalled());

    let logout!: Promise<void>;
    act(() => { logout = result.current.signOut(); });
    expect(result.current.isAuthenticated).toBe(false);
    await act(async () => {
        write.resolve();
        await Promise.all([login, logout]);
    });

    expect(mockStored).toEqual({});
    expect(result.current.isAuthenticated).toBe(false);
});

it('does not let old logout cleanup clear a new login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await act(async () => { await result.current.setAuth('access-a', userA, 'refresh-a'); });
    const cleanup = deferred<void>();
    result.current.registerSignOutTask(() => cleanup.promise);
    let logout!: Promise<void>;
    act(() => { logout = result.current.signOut(); });
    await act(async () => { await result.current.setAuth('access-b', userB, 'refresh-b'); });
    await act(async () => { cleanup.resolve(); await logout; });

    expect(result.current.user).toEqual(userB);
    expect(mockStored.token).toBe('access-b');
});

it('preserves the current user when an immediate refresh returns only tokens', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    jest.mocked(refreshAuthToken).mockResolvedValueOnce({ token: 'renewed-access-a' });
    await act(async () => {
        // Start before React has committed the login state.
        const login = result.current.setAuth('access-a', userA, 'refresh-a');
        const refresh = result.current.refreshSession();
        await Promise.all([login, refresh]);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('renewed-access-a');
    expect(result.current.user).toEqual(userA);
});
