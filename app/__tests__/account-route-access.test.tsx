import React from 'react';
import { render } from '@testing-library/react-native';
import type { EntitlementState } from '../../src/features/subscription/types';

let mockAuthenticated = true;
let mockOnboarded = true;
let mockEntitlement: EntitlementState = { status: 'inactive' };
const mockRouter = { replace: jest.fn() };

jest.mock('expo-router', () => {
    const ReactForMock = require('react');
    const { Text, View } = require('react-native');
    const Stack = ({ children }: { children: React.ReactNode }) => ReactForMock.createElement(View, null, children);
    Stack.Protected = ({ guard, children }: { guard: boolean; children: React.ReactNode }) => guard ? children : null;
    Stack.Screen = ({ name }: { name: string }) => ReactForMock.createElement(Text, null, `route:${name}`);
    return { Stack, useRouter: () => mockRouter };
});
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), wrap: (component: unknown) => component }));
jest.mock('expo-notifications', () => ({
    addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
    getLastNotificationResponse: () => null,
}));
jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: mockAuthenticated, hydrated: true }),
}));
jest.mock('../../src/context/onboarding/OnboardingContext', () => ({
    useOnboarding: () => ({ hasOnboarded: mockOnboarded, hydrated: true }),
}));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ hydrated: true }),
}));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => ({ state: mockEntitlement }),
}));
jest.mock('../../src/features/subscription/storeKit', () => ({ initializeStoreKit: jest.fn() }));
jest.mock('../../src/hooks/usePushNotifications', () => ({ usePushNotifications: jest.fn() }));
jest.mock('../../src/hooks/useTimeZoneSync', () => ({ useTimeZoneSync: jest.fn() }));

import { Gate } from '../_layout';

beforeEach(() => {
    mockAuthenticated = true;
    mockOnboarded = true;
    mockEntitlement = { status: 'inactive' };
});

it.each<EntitlementState>([
    { status: 'inactive' },
    { status: 'loading' },
    { status: 'unknown', reason: 'network' },
])('registers account settings with entitlement $status', (state) => {
    mockEntitlement = state;
    const view = render(<Gate />);
    expect(view.getByText('route:account')).toBeTruthy();
});

it('registers account settings before onboarding is completed', () => {
    mockOnboarded = false;
    const view = render(<Gate />);
    expect(view.getByText('route:account')).toBeTruthy();
    expect(view.queryByText('route:(tabs)')).toBeNull();
});

it('removes account settings from the stack after logout', () => {
    const view = render(<Gate />);
    expect(view.getByText('route:account')).toBeTruthy();
    mockAuthenticated = false;
    view.rerender(<Gate />);
    expect(view.queryByText('route:account')).toBeNull();
    expect(view.getByText('route:(auth)')).toBeTruthy();
});
