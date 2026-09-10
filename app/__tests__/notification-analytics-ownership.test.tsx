import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { NotificationResponse } from 'expo-notifications';

let mockAuthHydrated = true;
let mockOnboarded = false;
let mockOwner: string | null | undefined = 'A';
let mockLastResponse: NotificationResponse | null = null;
let mockReceive: ((response: NotificationResponse) => void) | undefined;
const mockCapture = jest.fn();
const mockRouter = { replace: jest.fn() };
const mockClear = jest.fn();
jest.mock('expo-router', () => {
    const ReactForMock = require('react');
    const { View } = require('react-native');
    const Stack = ({ children }: { children: React.ReactNode }) => ReactForMock.createElement(View, null, children);
    Stack.Protected = ({ guard, children }: { guard: boolean; children: React.ReactNode }) => guard ? children : null;
    Stack.Screen = () => null;
    return { Stack, useRouter: () => mockRouter };
});
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), wrap: (component: unknown) => component }));
jest.mock('expo-notifications', () => ({
    addNotificationResponseReceivedListener: (listener: (response: NotificationResponse) => void) => { mockReceive = listener; return { remove: jest.fn() }; },
    getLastNotificationResponse: () => mockLastResponse,
    clearLastNotificationResponse: () => mockClear(),
}));
jest.mock('../../src/features/analytics/client', () => ({ analytics: { capture: (...args: unknown[]) => mockCapture(...args), getIdentity: () => mockOwner } }));
jest.mock('../../src/context/auth/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: Boolean(mockOwner), hydrated: mockAuthHydrated }) }));
jest.mock('../../src/context/onboarding/OnboardingContext', () => ({ useOnboarding: () => ({ hasOnboarded: mockOnboarded, hydrated: true }) }));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({ useOnboardingAnswers: () => ({ hydrated: true }) }));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({ useEntitlementState: () => ({ state: { status: 'active' } }) }));
jest.mock('../../src/features/subscription/storeKit', () => ({ initializeStoreKit: jest.fn() }));
jest.mock('../../src/hooks/usePushNotifications', () => ({ usePushNotifications: jest.fn() }));
jest.mock('../../src/hooks/useTimeZoneSync', () => ({ useTimeZoneSync: jest.fn() }));
jest.mock('../../src/features/dev/DemoSeedRunner', () => ({ DemoSeedRunner: () => null }));
import { Gate } from '../_layout';
const response = (id: string): NotificationResponse => ({ notification: { request: { identifier: id, content: { data: { kind: 'review_note', privateText: 'never export' } } } } }) as unknown as NotificationResponse;
beforeEach(() => {
    jest.clearAllMocks();
    mockAuthHydrated = true;
    mockOnboarded = false;
    mockOwner = 'A';
    mockLastResponse = null;
    mockReceive = undefined;
});

test('pending A tap still navigates when B is ready but never emits an event attributed to B', () => {
    const view = render(<Gate />);
    const tap = response('A-to-B-tap');
    act(() => { mockReceive!(tap); });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    // Expo also returns the same response again from its launch-response API.
    mockLastResponse = tap;
    mockOwner = 'B';
    mockOnboarded = true;
    view.rerender(<Gate />);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/notes');
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockCapture).not.toHaveBeenCalled();
});

test('unresolved cold launch can be attributed to the restored account after auth hydration', () => {
    mockOwner = undefined;
    mockAuthHydrated = false;
    mockLastResponse = response('cold-hydration-tap');
    const view = render(<Gate />);
    expect(mockCapture).not.toHaveBeenCalled();
    mockOwner = 'A';
    mockAuthHydrated = true;
    mockOnboarded = true;
    view.rerender(<Gate />);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/notes');
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith('notification_opened', { reminder_kind: 'review_note', destination: 'notes' }, { dedupeKey: 'notification-open:cold-hydration-tap' });
});
