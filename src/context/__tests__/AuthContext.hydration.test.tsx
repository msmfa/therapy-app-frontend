import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';

/**
 * A session is only usable if BOTH the token and the user survived. Routing on
 * the token alone sends a half-restored session into the app, where
 * OnboardingProvider has a null userId, reports onboarding incomplete, and
 * finishOnboarding() is a no-op — the user is stuck with no way back to the
 * login screen.
 */
const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

jest.mock('../../api/auth', () => ({
  refreshAuthToken: jest.fn(),
}));

import { AuthProvider, useAuth } from '../auth/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const renderAuth = async () => {
  const result = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.result.current.hydrated).toBe(true));
  return result;
};

const validUser = { id: 'u1', email: 'a@b.com', name: 'A' };

describe('hydrating a partial persisted session', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('restores a complete session', async () => {
    mockStore.set('token', 'access-token');
    mockStore.set('refreshToken', 'refresh-token');
    mockStore.set('user', JSON.stringify(validUser));

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(validUser);
    expect(result.current.token).toBe('access-token');
  });

  it('refuses a token with no stored user and clears it', async () => {
    mockStore.set('token', 'access-token');
    mockStore.set('refreshToken', 'refresh-token');

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(mockStore.has('token')).toBe(false);
    expect(mockStore.has('refreshToken')).toBe(false);
  });

  it('refuses a token with unparseable user JSON and clears it', async () => {
    mockStore.set('token', 'access-token');
    mockStore.set('user', '{ this is not json');

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(mockStore.has('token')).toBe(false);
    expect(mockStore.has('user')).toBe(false);
  });

  it('refuses a user record missing required fields', async () => {
    mockStore.set('token', 'access-token');
    mockStore.set('user', JSON.stringify({ id: 'u1' }));

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockStore.has('token')).toBe(false);
  });

  it('refuses a stored user with no token', async () => {
    mockStore.set('user', JSON.stringify(validUser));

    const { result } = await renderAuth();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockStore.has('user')).toBe(false);
  });

  it('signals hydration completion even when the session is discarded', async () => {
    mockStore.set('token', 'access-token');

    const { result } = await renderAuth();

    // The gate waits on `hydrated`; failing to set it would hang on a spinner.
    expect(result.current.hydrated).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('isAuthenticated requires a coherent session', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('is false while a token exists without a user', async () => {
    const { result } = await renderAuth();

    // setAuth with a null user must not produce an "authenticated" state.
    await waitFor(async () => {
      await result.current.setAuth('some-token', null, 'some-refresh');
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
