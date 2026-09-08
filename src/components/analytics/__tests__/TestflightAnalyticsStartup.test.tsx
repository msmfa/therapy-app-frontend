import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Exercise the real build config, singleton, auth, initializer and sync with
// native/SDK/network boundaries mocked. No consent toggle should be necessary.
jest.mock('../../../features/analytics/config', () => {
    Object.assign(global, { __DEV__: false });
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
    process.env.EXPO_PUBLIC_ANALYTICS_ENVIRONMENT = 'qa';
    process.env.EXPO_PUBLIC_ANALYTICS_TESTFLIGHT_PRECONSENT = '1';
    process.env.EXPO_PUBLIC_SEED_DEMO = '0';
    process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE = '0';
    delete process.env.EXPO_PUBLIC_ANALYTICS_INTERNAL_USER;
    return jest.requireActual('../../../features/analytics/config');
});
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async () => null),
    setItemAsync: jest.fn(async () => undefined),
    deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('../../../api/auth', () => ({ refreshAuthToken: jest.fn() }));
jest.mock('../../../api/users', () => ({
    getCurrentUserSettings: jest.fn(async () => ({ analyticsConsent: false })),
    updateCurrentUser: jest.fn(),
}));
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
jest.mock('posthog-react-native', () => ({
    __esModule: true,
    PostHogPersistedProperty: { Queue: 'queue', LogsQueue: 'logs_queue', PersonMode: 'person_mode' },
    default: function MockPostHog() { return mockSdk; },
}));

import { getCurrentUserSettings, updateCurrentUser } from '../../../api/users';
import { AuthProvider, useAuth } from '../../../context/auth/AuthContext';
import { analytics } from '../../../features/analytics/client';
import { analyticsConsentSync } from '../../../features/analytics/consentSync';
import { CONSENT_KEY } from '../../../features/analytics/config';
import { AnalyticsConsentControl } from '../AnalyticsConsentControl';
import { AnalyticsInitializer } from '../AnalyticsInitializer';

let auth!: ReturnType<typeof useAuth>;
function Welcome() {
    auth = useAuth();
    return <>
        <Text>{ auth.hydrated ? 'Welcome' : 'Loading' }</Text>
        <AnalyticsConsentControl />
    </>;
}

test('TestFlight enables locally through real auth startup and never changes public consent', async () => {
    const productionPreference = 'plastic_brains.analytics_consent.v1.account.user-a';
    const qaPreference = 'plastic_brains.analytics_consent.v1.qa.account.user-a';
    await AsyncStorage.setItem(productionPreference, 'false');
    await AsyncStorage.setItem(qaPreference, 'false');
    const screen = render(<AuthProvider><AnalyticsInitializer /><Welcome /></AuthProvider>);
    expect(screen.queryByLabelText('Share app usage')).toBeNull();
    await waitFor(() => expect(analytics.getSnapshot().enabled).toBe(true));
    expect(analytics.getIdentity()).toBeNull();
    expect(analytics.capture('onboarding_step_viewed', { onboarding_step: 'welcome', flow_version: '1' })).toBe(true);
    expect(CONSENT_KEY).toBe('plastic_brains.analytics_consent.v1.qa.testflight');
    expect(await AsyncStorage.getItem(`${CONSENT_KEY}.anonymous`)).toBe('true');

    const user = { id: 'user-a', name: 'Test user', email: 'test@example.invalid' };
    await act(async () => { await auth.setAuth('test-token', user); });
    await waitFor(() => expect(analytics.getSnapshot().enabled).toBe(true));
    expect(mockSdk.identify).toHaveBeenLastCalledWith(user.id);
    expect(await AsyncStorage.getItem(`${CONSENT_KEY}.account.user-a`)).toBe('true');
    const visit = analytics.getVisitId();
    await act(async () => { await auth.setAuth('refreshed-token', user); });
    expect(analytics.getVisitId()).toBe(visit);
    await analyticsConsentSync.sync();

    expect(await AsyncStorage.getItem(productionPreference)).toBe('false');
    expect(await AsyncStorage.getItem(qaPreference)).toBe('false');
    expect(getCurrentUserSettings).not.toHaveBeenCalled();
    expect(updateCurrentUser).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Share app usage')).toBeNull();
    expect(screen.queryByText(/Help improve Plastic Brains/)).toBeNull();
});
