/**
 * Regression test for spurious sign-outs on launch.
 *
 * AuthProvider hydration used to publish the access token and the user (which is
 * what `isAuthenticated` is derived from) and only afterwards, on the far side of
 * a `SecureStore.setItemAsync` await, publish the refresh token. Every effect
 * keyed on `isAuthenticated` fires the moment the first half lands, so a 401 could
 * arrive while `refreshTokenRef.current` was still null.
 *
 * `refreshSession()` read that ref, saw null, and returned false WITHOUT making
 * a request, so the api client went straight to `onAuthFailure()` and signed the
 * user out, discarding a refresh token that was in SecureStore the whole time.
 * That matched production: the Sentry breadcrumbs for the incident contain no
 * POST /api/auth/refresh anywhere.
 *
 * Hydration now publishes the refresh token before it announces the session as
 * authenticated, with no await in between, so the window is closed.
 *
 * Scope, so nobody over-reads this: the window only ever opened when hydration
 * had a reason to await, which is `normalized !== storedToken` -- a token
 * persisted with the Bearer prefix still on it, or with stray whitespace. With
 * a clean stored token there is no await and no window. Reproducing it needs a
 * keychain write slow enough for React to commit and flush effects, which this
 * test forces with a 10ms write. On an iOS 26.3 simulator the write was fast
 * enough that the refresh still went out even without the fix, so this is a
 * latent ordering hazard rather than something confirmed in the wild.
 */
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('expo-secure-store', () => {
    const store: Record<string, string> = {
        // Stored with the Bearer prefix, so hydration rewrites it. That rewrite
        // is the await which opens the window.
        token: 'Bearer access-token',
        refreshToken: 'a-perfectly-good-refresh-token',
        user: JSON.stringify({ id: 'u1', email: 'a@b.com', name: 'A' }),
    };
    return {
        getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
        setItemAsync: jest.fn(async (key: string, value: string) => {
            // Keychain writes are not instant.
            await new Promise((resolve) => setTimeout(resolve, 10));
            store[key] = value;
        }),
        deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
    };
});

const requests: string[] = [];

const response = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: {
        get: (header: string) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
});

beforeEach(() => {
    requests.length = 0;
    // @ts-expect-error minimal fetch double
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
        const path = String(url).split('?')[0].replace(/^https?:\/\/[^/]+/, '');
        requests.push(`${init?.method ?? 'GET'} ${path}`);

        if (path.includes('/auth/refresh')) {
            return response(200, {
                token: 'fresh-access-token',
                refreshToken: 'fresh-refresh-token',
                user: { id: 'u1', email: 'a@b.com', name: 'A' },
            });
        }

        return response(401, { error: 'Unauthorized' });
    });
});

import { AuthProvider, useAuth } from '../AuthContext';
import { TherapySessionsProvider } from '../../therapy-sessions/TherapySessionsContext';

let finalIsAuthenticated = false;

function Probe() {
    const { isAuthenticated, hydrated } = useAuth();
    if (hydrated) {
        finalIsAuthenticated = isAuthenticated;
    }
    return <Text>probe</Text>;
}

test('a 401 during hydration refreshes the session instead of signing the user out', async () => {
    render(
        <AuthProvider>
            <TherapySessionsProvider>
                <Probe />
            </TherapySessionsProvider>
        </AuthProvider>,
    );

    for (let i = 0; i < 60; i++) {
        await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1)); });
    }

    expect(requests.some((request) => request.includes('/auth/refresh'))).toBe(true);
    expect(finalIsAuthenticated).toBe(true);
});
