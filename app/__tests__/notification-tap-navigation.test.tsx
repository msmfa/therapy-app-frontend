import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Stack, router, type Href } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';

let mockAuthHydrated = true;
let redraw: () => void;
const mockRenderContext = React.createContext(0);
let mockLastResponse: unknown = null;
let mockListener: ((r: unknown) => void) | null = null;
let rootMounts = 0;
let tabsMounts = 0;

// The calendar provider is not mounted here; the permission ask it drives
// has its own tests.
jest.mock('../../src/hooks/useAskForNotificationsOnOpen', () => ({
    useAskForNotificationsOnOpen: jest.fn(),
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => { require('react').useContext(mockRenderContext); return { isAuthenticated: true, hydrated: mockAuthHydrated }; },
}));
jest.mock('../../src/context/onboarding/OnboardingContext', () => ({
    useOnboarding: () => { require('react').useContext(mockRenderContext); return { hasOnboarded: true, hydrated: true }; },
}));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({ useOnboardingAnswers: () => ({ hydrated: true }) }));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => ({ state: { status: 'active', plan: 'annual', productId: 'a', expiresAt: null } }),
}));
jest.mock('../../src/features/analytics/notificationAnalytics', () => ({
    captureNotificationOpened: jest.fn(), rememberNotificationReceipt: () => ({ owner: 'u' }),
}));
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), wrap: (c: unknown) => c, withScope: jest.fn(), captureException: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: (cb: (r: unknown) => void) => { mockListener = cb; return { remove: jest.fn() }; },
    getLastNotificationResponse: () => mockLastResponse,
    clearLastNotificationResponse: () => { mockLastResponse = null; },
}));
jest.mock('../../src/features/subscription/storeKit', () => ({ initializeStoreKit: jest.fn() }));
jest.mock('../../src/hooks/usePushNotifications', () => ({ usePushNotifications: jest.fn() }));
jest.mock('../../src/hooks/useTimeZoneSync', () => ({ useTimeZoneSync: jest.fn() }));
jest.mock('../../src/features/widgets/ProgressWidgetSync', () => ({ ProgressWidgetSync: () => null }));
jest.mock('../../src/features/dev/DemoSeedRunner', () => ({ DemoSeedRunner: () => null }));

import { Gate } from '../_layout';
import Index from '../index';
import TabsLayout from '../(tabs)/_layout';

/** Stands in for the real root layout, counting how often it mounts. */
function Root() {
    const [version, setVersion] = useState(0);
    redraw = () => setVersion((v) => v + 1);
    useEffect(() => { rootMounts += 1; if (rootMounts > 20) throw new Error('remount loop'); }, []);
    return <mockRenderContext.Provider value={ version }><Gate /></mockRenderContext.Provider>;
}
function Tabs() { useEffect(() => { tabsMounts += 1; }, []); return <TabsLayout />; }

function flush() { for (let i = 0; i < 6; i++) { act(() => { try { jest.advanceTimersByTime(50); } catch { /* real timers */ } }); } }
const resp = (id: string, kind: string) => ({ notification: { request: { identifier: id, content: { data: { kind } } } }, actionIdentifier: 'default' });

type RootStackState = { routes: { state?: { routes: { name: string }[] } }[] };
function rootStackRouteNames(view: ReturnType<typeof mount>): string[] | undefined {
    return (view as unknown as { getRouterState: () => RootStackState }).getRouterState().routes[0].state?.routes.map((r) => r.name);
}

function mount(initialUrl: string) {
    return renderRouter({
        _layout: Root,
        index: () => <Index />,
        '(auth)/_layout': () => <Stack />,
        '(auth)/login': () => <Text>Sign in</Text>,
        '(onboarding)/_layout': () => <Stack />,
        '(onboarding)/index': () => <Text>Welcome</Text>,
        '(tabs)/_layout': Tabs,
        '(tabs)/index': () => <Text>Compose a note</Text>,
        '(tabs)/notes': () => <Text>Your notes</Text>,
        '(tabs)/calendar': () => <Text>Your calendar</Text>,
        '(tabs)/settings': () => <Text>Tab settings</Text>,
        'reminder-settings': () => <Text>Reminder settings screen</Text>,
        'session-schedule': () => <Text>Schedule screen</Text>,
        account: () => <Text>Standalone settings</Text>,
        '+not-found': () => <Text>Not found</Text>,
    }, { initialUrl });
}

beforeEach(() => { rootMounts = 0; tabsMounts = 0; mockListener = null; mockLastResponse = null; mockAuthHydrated = true; });

/**
 * Cold start from a tap. The handler used to navigate in the same commit that
 * mounted the root Stack, before the Stack had any navigation state. Expo
 * Router then replaced the whole root layout, so every provider mounted twice
 * and the user sat through the launch spinners again.
 */
describe('cold start from a notification tap', () => {
    it('control: without a notification the root layout mounts once', () => {
        mockAuthHydrated = false;
        mount('/');
        act(() => { mockAuthHydrated = true; redraw(); });
        flush();
        expect(rootMounts).toBe(1);
    });

    it.each([
        ['log_note', ['(tabs)']],
        ['review_note', ['(tabs)', 'notes']],
    ])('a %s tap lands on its tab and mounts the root layout once', (kind, segments) => {
        mockAuthHydrated = false;
        mockLastResponse = resp(`cold-${kind}`, kind);
        const view = mount('/');
        act(() => { mockAuthHydrated = true; redraw(); });
        flush();
        expect(view.getSegments()).toEqual(segments);
        expect(rootMounts).toBe(1);
    });
});

/**
 * Warm tap with a root-level screen open on top of the tabs. A replace swapped
 * that screen for a fresh set of tabs stacked on the existing ones, so Notes
 * reloaded behind a spinner and swiping back showed a stale copy of the app.
 */
describe('warm notification tap', () => {
    it('control: from inside the tabs it switches tab without remounting anything', async () => {
        const view = mount('/notes');
        await waitFor(() => expect(screen.getByText('Your notes')).toBeTruthy());
        const before = rootMounts; const tb = tabsMounts;
        act(() => { mockListener!(resp('warm-1', 'log_note')); });
        flush();
        expect(rootMounts - before).toBe(0);
        expect(tabsMounts - tb).toBe(0);
        expect(view.getSegments()).toEqual(['(tabs)']);
    });

    it.each<[Href, string, string, string[]]>([
        ['/reminder-settings', 'review_note', 'Reminder settings screen', ['(tabs)', 'notes']],
        ['/session-schedule', 'review_note', 'Schedule screen', ['(tabs)', 'notes']],
        ['/reminder-settings', 'log_note', 'Reminder settings screen', ['(tabs)']],
    ])('with %s open, a %s tap returns to the existing tabs', async (path, kind, title, segments) => {
        const view = mount('/notes');
        await waitFor(() => expect(screen.getByText('Your notes')).toBeTruthy());
        act(() => { router.push(path); });
        await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
        const tb = tabsMounts;
        act(() => { mockListener!(resp(`warm-${path}-${kind}`, kind)); });
        flush();
        expect(view.getSegments()).toEqual(segments);
        expect({ names: rootStackRouteNames(view), freshTabsMounts: tabsMounts - tb }).toEqual({ names: ['(tabs)'], freshTabsMounts: 0 });
    });
});
