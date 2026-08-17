import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
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

describe('signOut cleanup ordering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs registered cleanup while the credentials are still usable', async () => {
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.setAuth(
        'access-token-123',
        { id: 'u1', email: 'a@b.com', name: 'A' },
        'refresh-token-123',
      );
    });

    // This is what the push hook needs: a chance to call the API with a live
    // token before sign-out tears the session down.
    const tokenSeenByCleanup: Array<string | null> = [];
    act(() => {
      result.current.registerSignOutTask(async () => {
        tokenSeenByCleanup.push(result.current.token);
      });
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(tokenSeenByCleanup).toEqual(['access-token-123']);
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('still signs out when a cleanup task rejects', async () => {
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.setAuth(
        'access-token-456',
        { id: 'u2', email: 'c@d.com', name: 'C' },
        'refresh-token-456',
      );
    });

    act(() => {
      result.current.registerSignOutTask(async () => {
        throw new Error('network down');
      });
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('does not run cleanup that has been unregistered', async () => {
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.setAuth(
        'access-token-789',
        { id: 'u3', email: 'e@f.com', name: 'E' },
        'refresh-token-789',
      );
    });

    const task = jest.fn(async () => undefined);
    let unregister: () => void = () => undefined;
    act(() => {
      unregister = result.current.registerSignOutTask(task);
    });
    act(() => {
      unregister();
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(task).not.toHaveBeenCalled();
    expect(result.current.token).toBeNull();
  });

  it('skips cleanup when the session is already known to be invalid', async () => {
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.setAuth(
        'expired-token',
        { id: 'u4', email: 'g@h.com', name: 'G' },
        'expired-refresh',
      );
    });

    const task = jest.fn(async () => undefined);
    act(() => {
      result.current.registerSignOutTask(task);
    });

    await act(async () => {
      await result.current.signOut({ skipCleanup: true });
    });

    expect(task).not.toHaveBeenCalled();
    expect(result.current.token).toBeNull();
  });
});
