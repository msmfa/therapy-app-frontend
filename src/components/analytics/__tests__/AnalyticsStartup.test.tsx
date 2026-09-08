import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Keep the real singleton, auth identity, initializer, account sync and
// transport together. Only native storage, the SDK and the API are boundaries.
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));
jest.mock('../../../api/auth', () => ({ refreshAuthToken: jest.fn() }));
jest.mock('../../../api/users', () => ({
    getCurrentUserSettings: jest.fn(),
    updateCurrentUser: jest.fn(),
}));
jest.mock('../../../features/analytics/config', () => {
    const actual = jest.requireActual('../../../features/analytics/config');
    return {
        ...actual,
        analyticsConfig: () => ({
            apiKey: 'phc_test', host: 'https://eu.i.posthog.com', allowed: true,
            appVersion: 'test', platform: 'ios', environment: 'production',
        }),
    };
});
const mockSdk = {
    ready: jest.fn(async () => undefined),
    optIn: jest.fn(async () => undefined),
    optOut: jest.fn(async () => undefined),
    getPersistedProperty: jest.fn(() => null),
    setPersistedProperty: jest.fn(),
    getDistinctId: jest.fn(() => 'anonymous'),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
};
const mockCreateSdk = jest.fn(() => mockSdk);
jest.mock('posthog-react-native', () => ({
    __esModule: true,
    PostHogPersistedProperty: { Queue: 'queue', LogsQueue: 'logs_queue', PersonMode: 'person_mode' },
    default: function MockPostHog() { return mockCreateSdk(); },
}));

import { getCurrentUserSettings, updateCurrentUser } from '../../../api/users';
import { AuthProvider, useAuth } from '../../../context/auth/AuthContext';
import { analytics } from '../../../features/analytics/client';
import { CONSENT_KEY } from '../../../features/analytics/config';
import { AnalyticsInitializer } from '../AnalyticsInitializer';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
    return { promise, resolve, reject };
};

function HydratedWelcome() {
    const { hydrated, isAuthenticated } = useAuth();
    if (!hydrated) return <Text>Loading session</Text>;
    return <Text>{ isAuthenticated ? 'Authenticated' : 'Anonymous' }</Text>;
}

test('cold keychain failure still starts anonymous analytics automatically after auth hydration', async () => {
    const keychain = deferred<string | null>();
    const consentRead = deferred<string | null>();
    const consentKey = `${CONSENT_KEY}.anonymous`;
    const keychainError = Object.assign(new Error('Keychain access failed'), { code: 'ERR_KEY_CHAIN' });
    jest.mocked(SecureStore.getItemAsync).mockReturnValue(keychain.promise);
    // The unsigned simulator build fails deletion as well as reads. That
    // cleanup failure must not prevent AuthProvider's final hydration state.
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(keychainError);
    jest.mocked(AsyncStorage.getItem).mockImplementation(async (key) =>
        key === consentKey ? consentRead.promise : null);
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
        expect(analytics.getIdentity()).toBeUndefined();
        const screen = render(
            <AuthProvider>
                <AnalyticsInitializer />
                <HydratedWelcome />
            </AuthProvider>,
        );
        expect(screen.getByText('Loading session')).toBeTruthy();
        expect(analytics.getSnapshot().hydrated).toBe(false);
        expect(mockCreateSdk).not.toHaveBeenCalled();

        await act(async () => { keychain.reject(keychainError); });
        await waitFor(() => expect(screen.getByText('Anonymous')).toBeTruthy());
        expect(analytics.getIdentity()).toBeNull();
        expect(screen.queryByLabelText('Share app usage')).toBeNull();
        expect(mockCreateSdk).not.toHaveBeenCalled();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
        expect(errorLog).toHaveBeenCalledWith('[AuthProvider] hydration error:', keychainError);

        await act(async () => { consentRead.resolve('false'); });
        await waitFor(() => expect(analytics.getSnapshot().enabled).toBe(true));
        expect(analytics.getSnapshot()).toMatchObject({ hydrated: true, consentKnown: true, consent: true });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(consentKey, 'true');
        expect(mockCreateSdk).toHaveBeenCalledTimes(1);
        expect(mockSdk.ready).toHaveBeenCalledTimes(1);
        expect(mockSdk.optIn).toHaveBeenCalledTimes(1);
        expect(mockSdk.identify).not.toHaveBeenCalled();
        expect(getCurrentUserSettings).not.toHaveBeenCalled();
        expect(updateCurrentUser).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Share app usage')).toBeNull();
    } finally {
        errorLog.mockRestore();
    }
});
