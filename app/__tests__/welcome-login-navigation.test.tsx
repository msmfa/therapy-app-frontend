import React, { useState } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { EntitlementState } from '../../src/features/subscription/types';
import type { OnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

let mockAuthenticated = false;
let mockEntitlement: EntitlementState = { status: 'inactive' };
let mockAnswers: Partial<OnboardingAnswers> = { resumeRoute: null };
let redraw: () => void;
const mockRenderContext = React.createContext(0);
const mockGetSettings = jest.fn();
const mockUpdateSettings = jest.fn();
const mockLogin = jest.fn();
const mockShowAlert = jest.fn();
const mockSetAuth = jest.fn(async () => {
    mockAuthenticated = true;
    redraw();
});

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => {
        require('react').useContext(mockRenderContext);
        return {
            isAuthenticated: mockAuthenticated,
            hydrated: true,
            setAuth: mockSetAuth,
            user: mockAuthenticated ? { id: 'returning-user' } : null,
        };
    },
}));
jest.mock('../../src/api/auth', () => ({ loginWithPassword: (...args: unknown[]) => mockLogin(...args) }));
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: mockShowAlert }) }));
jest.mock('../../src/components/auth/SocialAuthButtons', () => () => null);
jest.mock('../../src/api/users', () => ({
    getCurrentUserSettings: () => mockGetSettings(),
    updateCurrentUser: (...args: unknown[]) => mockUpdateSettings(...args),
}));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ hydrated: true, answers: mockAnswers }),
}));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => ({ state: mockEntitlement }),
}));
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), wrap: (component: unknown) => component }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, Feather: () => null }));
jest.mock('expo-notifications', () => ({
    addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
    getLastNotificationResponse: () => null,
}));
jest.mock('../../src/features/subscription/storeKit', () => ({ initializeStoreKit: jest.fn() }));
jest.mock('../../src/hooks/usePushNotifications', () => ({ usePushNotifications: jest.fn() }));
jest.mock('../../src/hooks/useTimeZoneSync', () => ({ useTimeZoneSync: jest.fn() }));
jest.mock('../../src/features/widgets/ProgressWidgetSync', () => ({ ProgressWidgetSync: () => null }));
jest.mock('../../src/features/dev/DemoSeedRunner', () => ({ DemoSeedRunner: () => null }));

import { OnboardingProvider } from '../../src/context/onboarding/OnboardingContext';
import { Gate } from '../_layout';
import Index from '../index';
import WelcomeScreen from '../(onboarding)';
import AuthLayout from '../(auth)/_layout';
import LoginScreen from '../(auth)/login';
import TabsLayout from '../(tabs)/_layout';

function Root() {
    const [version, setVersion] = useState(0);
    redraw = () => setVersion((value) => value + 1);
    return (
        <mockRenderContext.Provider value={ version }>
            <OnboardingProvider><Gate /></OnboardingProvider>
        </mockRenderContext.Provider>
    );
}

function mount({ realLogin = false } = {}) {
    return renderRouter({
        _layout: Root,
        index: Index,
        '(auth)/_layout': AuthLayout,
        '(auth)/login': realLogin ? LoginScreen : () => <Text>Login form</Text>,
        '(onboarding)/_layout': () => <Stack />,
        '(onboarding)/index': WelcomeScreen,
        '(onboarding)/goal': () => <Text>Choose your goal</Text>,
        '(onboarding)/reminder-times': () => <Text>Choose reminder times</Text>,
        '(onboarding)/subscription-preview': () => <Text>Choose subscription</Text>,
        '(tabs)/_layout': TabsLayout,
        '(tabs)/index': () => <Text>Compose a note</Text>,
        '(tabs)/notes': () => <Text>Your notes</Text>,
        '(tabs)/calendar': () => <Text>Your calendar</Text>,
        '(tabs)/settings': () => <Text>Tab settings</Text>,
        account: () => <Text>Account settings</Text>,
        '+not-found': () => <Text>Not found</Text>,
    }, { initialUrl: '/' });
}

beforeEach(() => {
    mockAuthenticated = false;
    mockLogin.mockReset().mockResolvedValue({ token: 'test-token', user: { id: 'returning-user', name: 'Test', email: 'existing@example.com' } });
    mockShowAlert.mockClear();
    mockSetAuth.mockClear();
    mockEntitlement = { status: 'inactive' };
    mockAnswers = { resumeRoute: null };
    jest.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue(undefined);
    mockGetSettings.mockReset().mockResolvedValue({ onboardingCompleted: false });
    mockUpdateSettings.mockReset().mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

it('opens login from Welcome and allows Back to return without a redirect loop', async () => {
    const view = mount();
    fireEvent.press(await screen.findByText('I already have an account'));
    await screen.findByText('Login form');
    expect(view.getPathname()).toBe('/login');
    act(() => router.back());
    await screen.findByText('I already have an account');
});

it('lets a retained signed-in account continue its unfinished setup', async () => {
    mockAuthenticated = true;
    const view = mount();
    fireEvent.press(await screen.findByText('Continue with your account'));
    await screen.findByText('Choose your goal');
    expect(view.getPathname()).toBe('/goal');
    expect(screen.queryByText('Login form')).toBeNull();
});

it('gives a retained account access to account settings', async () => {
    mockAuthenticated = true;
    const view = mount();
    fireEvent.press(await screen.findByText('Manage your account'));
    await screen.findByText('Account settings');
    expect(view.getPathname()).toBe('/account');
});

it('resumes a signed-in account at its saved valid onboarding step', async () => {
    mockAuthenticated = true;
    mockAnswers = {
        resumeRoute: '/(onboarding)/reminder-times',
        goal: 'practise',
        sessionDateSkipped: true,
        sessionAt: null,
        cadence: 'weekly',
    };
    mount();
    await screen.findByText('Choose reminder times');
    expect(screen.queryByText('Continue with your account')).toBeNull();
});

it('sends an account that completed onboarding into the app', async () => {
    mockAuthenticated = true;
    mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
    mockGetSettings.mockResolvedValue({ onboardingCompleted: true });
    mount();
    await screen.findByText('Your notes');
    expect(screen.queryByText('Continue with your account')).toBeNull();
});

it.each([true, false])('blocks unknown status until retry confirms completion=%s', async (completed) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockAuthenticated = true;
    mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
    mockGetSettings.mockRejectedValueOnce(new Error('offline'));
    const view = mount();
    await screen.findByText('We couldn’t check your account');
    expect(screen.queryByText('Continue with your account')).toBeNull();
    expect(screen.queryByText('Your notes')).toBeNull();
    let resolveRetry!: (settings: { onboardingCompleted: boolean }) => void;
    mockGetSettings.mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
    fireEvent.press(screen.getByText('Try again'));
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Continue with your account')).toBeNull();
    expect(screen.queryByText('Your notes')).toBeNull();
    await act(async () => resolveRetry({ onboardingCompleted: completed }));
    if (completed) {
        await waitFor(() => expect(view.getSegments()[0]).toBe('(tabs)'));
        expect(screen.getByLabelText('Notes, tab, 3 of 4')).toBeTruthy();
        expect(screen.queryByText('Continue with your account')).toBeNull();
    } else {
        await screen.findByText('Continue with your account');
    }
});

it('blocks the already-mounted navigator when the check fails after login', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mount();
    fireEvent.press(await screen.findByText('I already have an account'));
    await screen.findByText('Login form');
    mockGetSettings.mockRejectedValueOnce(new Error('offline'));
    act(() => { mockAuthenticated = true; redraw(); });
    await screen.findByText('We couldn’t check your account');
    expect(screen.queryByText('Continue with your account')).toBeNull();
    expect(screen.queryByText('Manage your account')).toBeNull();
    fireEvent.press(screen.getByText('Try again'));
    await screen.findByText('Continue with your account');
});


it('submits the real login form and opens Notes after the account check resolves', async () => {
    let resolveSettings!: (settings: { onboardingCompleted: boolean }) => void;
    mockGetSettings.mockImplementationOnce(() => new Promise((resolve) => { resolveSettings = resolve; }));
    mockEntitlement = { status: 'active', plan: 'annual', productId: 'annual', expiresAt: null };
    const view = mount({ realLogin: true });
    fireEvent.press(await screen.findByText('I already have an account'));
    fireEvent.changeText(await screen.findByPlaceholderText('you@example.com'), 'existing@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'test-password');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(mockSetAuth).toHaveBeenCalled());
    await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());
    expect(screen.queryByText('Continue with your account')).toBeNull();
    await act(async () => resolveSettings({ onboardingCompleted: true }));
    await screen.findByText('Your notes');
    expect(view.getSegments()[0]).toBe('(tabs)');
    expect(mockShowAlert).not.toHaveBeenCalled();
});
