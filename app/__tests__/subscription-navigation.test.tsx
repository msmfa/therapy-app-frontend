import React, { useState } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { EntitlementState } from '../../src/features/subscription/types';

let mockAuthenticated = true;
let mockOnboarded = false;
let mockOnboardingHydrated = true;
let mockEntitlement: EntitlementState = { status: 'inactive' };
let redraw: () => void;
const mockRenderContext = React.createContext(0);
const mockIndexRendered = jest.fn();

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => {
        require('react').useContext(mockRenderContext);
        return { isAuthenticated: mockAuthenticated, hydrated: true };
    },
}));
jest.mock('../../src/context/onboarding/OnboardingContext', () => ({
    useOnboarding: () => {
        require('react').useContext(mockRenderContext);
        return { hasOnboarded: mockOnboarded, hydrated: mockOnboardingHydrated };
    },
}));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ hydrated: true }),
}));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => {
        require('react').useContext(mockRenderContext);
        return { state: mockEntitlement };
    },
}));
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), wrap: (component: unknown) => component }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-notifications', () => ({
    addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
    getLastNotificationResponse: () => null,
}));
jest.mock('../../src/features/subscription/storeKit', () => ({ initializeStoreKit: jest.fn() }));
jest.mock('../../src/hooks/usePushNotifications', () => ({ usePushNotifications: jest.fn() }));
jest.mock('../../src/hooks/useTimeZoneSync', () => ({ useTimeZoneSync: jest.fn() }));
jest.mock('../../src/features/dev/DemoSeedRunner', () => ({ DemoSeedRunner: () => null }));

import { Gate } from '../_layout';
import Index from '../index';
import TabsLayout from '../(tabs)/_layout';

function Root() {
    const [version, setVersion] = useState(0);
    redraw = () => setVersion((version) => version + 1);
    return <mockRenderContext.Provider value={ version }><Gate /></mockRenderContext.Provider>;
}

function mount(initialUrl: string) {
    return renderRouter({
        _layout: Root,
        index: () => { mockIndexRendered(); return <Index />; },
        '(auth)/_layout': () => <Stack />,
        '(auth)/login': () => <Text>Sign in</Text>,
        '(onboarding)/_layout': () => <Stack />,
        '(onboarding)/index': () => <Text>Welcome</Text>,
        '(onboarding)/account-preview': () => <Text>Checkout</Text>,
        '(onboarding)/subscription-preview': () => <Text>Choose subscription</Text>,
        '(onboarding)/success': () => <Text>Finish onboarding</Text>,
        '(tabs)/_layout': TabsLayout,
        '(tabs)/index': () => <Text>Compose a note</Text>,
        '(tabs)/notes': () => <Text>Your notes</Text>,
        '(tabs)/calendar': () => <Text>Your calendar</Text>,
        '(tabs)/settings': () => <Text>Tab settings</Text>,
        account: () => <Text>Standalone settings</Text>,
        '+not-found': () => <Text>Not found</Text>,
    }, { initialUrl });
}

// The root guard drops a removed checkout or onboarding screen straight into
// the (tabs) group and lets the tab navigator choose Notes, so the pathname
// stays "/" until a tab is pressed. Assert the focused tab, not a URL the app
// never navigated to.
async function expectNotesTab(view: ReturnType<typeof mount>) {
    await waitFor(() => expect(screen.getByText('Your notes')).toBeTruthy());
    expect(view.getSegments()[0]).toBe('(tabs)');
    expect(screen.getByLabelText('Notes, tab, 3 of 4').props.accessibilityState.selected).toBe(true);
}

beforeEach(() => {
    mockAuthenticated = true;
    mockOnboarded = false;
    mockOnboardingHydrated = true;
    mockEntitlement = { status: 'inactive' };
    mockIndexRendered.mockClear();
});

it('opens Notes with the tab navigator when onboarding completes', async () => {
    mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
    const view = mount('/success');
    expect(screen.getByText('Finish onboarding')).toBeTruthy();
    act(() => { mockOnboarded = true; redraw(); });
    await expectNotesTab(view);
    expect(screen.getByText('Your notes')).toBeTruthy();
    expect(screen.getByLabelText('Calendar, tab, 2 of 4')).toBeTruthy();
    expect(mockIndexRendered).not.toHaveBeenCalled();
    expect(screen.queryByText('Standalone settings')).toBeNull();
});

it('does not strand a returning subscriber in settings during sign-in hydration', async () => {
    mockAuthenticated = false;
    const view = mount('/account-preview');
    expect(screen.getByText('Checkout')).toBeTruthy();
    act(() => {
        mockAuthenticated = true;
        mockOnboarded = true;
        mockOnboardingHydrated = false;
        mockEntitlement = { status: 'loading' };
        redraw();
    });
    expect(screen.queryByText('Standalone settings')).toBeNull();
    act(() => {
        mockOnboardingHydrated = true;
        mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
        redraw();
    });
    await expectNotesTab(view);
    expect(screen.getByText('Your notes')).toBeTruthy();
});

it('returns a renewed subscriber to Notes after entitlement refresh removes checkout', async () => {
    mockOnboarded = true;
    const view = mount('/account-preview');
    expect(screen.getByText('Checkout')).toBeTruthy();
    act(() => { mockEntitlement = { status: 'loading' }; redraw(); });
    // The native purchase sheet is dismissing: keep its presenting screen
    // mounted until the refreshed entitlement has actually answered.
    expect(screen.getByText('Checkout')).toBeTruthy();
    expect(view.getPathname()).toBe('/account-preview');
    act(() => {
        mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
        redraw();
    });
    await expectNotesTab(view);
    expect(screen.getByLabelText('Calendar, tab, 2 of 4')).toBeTruthy();
    expect(mockIndexRendered).not.toHaveBeenCalled();
});

it('keeps account settings available when deliberately opened without a subscription', () => {
    mount('/account');
    expect(screen.getByText('Standalone settings')).toBeTruthy();
});

it('sends an existing account without an active subscription to the paywall', async () => {
    mockOnboarded = true;
    const view = mount('/');
    await waitFor(() => expect(view.getPathname()).toBe('/subscription-preview'));
    expect(screen.getByText('Choose subscription')).toBeTruthy();
    expect(screen.queryByText('Your notes')).toBeNull();
});
