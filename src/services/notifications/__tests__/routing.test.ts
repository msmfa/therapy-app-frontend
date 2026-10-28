import {
    notificationNavigationFor,
    resolveNotificationRoute,
    NOTE_COMPOSER_ROUTE,
    NOTES_LIST_ROUTE,
} from '../routing';

describe('resolveNotificationRoute', () => {
    it('sends a review reminder to the notes list', () => {
        expect(resolveNotificationRoute({ kind: 'review_note' })).toBe(NOTES_LIST_ROUTE);
    });

    it('sends a log reminder to the composer', () => {
        expect(resolveNotificationRoute({ kind: 'log_note' })).toBe(NOTE_COMPOSER_ROUTE);
    });

    /**
     * Notifications delivered before the payload existed carry no data at all,
     * and they must keep behaving as they did rather than failing to navigate.
     */
    it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty payload', {}],
        ['an unknown kind', { kind: 'something_new' }],
        ['a non-string kind', { kind: 7 }],
        ['a non-object payload', 'review_note'],
    ])('falls back to the composer for %s', (_label, data) => {
        expect(resolveNotificationRoute(data)).toBe(NOTE_COMPOSER_ROUTE);
    });
});

describe('notificationNavigationFor', () => {
    const rootWith = (stack: unknown) => ({
        stale: false as const, type: 'stack', key: 'container', index: 0, routeNames: ['__root'], preloadedRoutes: [],
        routes: [{ key: '__root-1', name: '__root', state: stack }],
    }) as unknown as Parameters<typeof notificationNavigationFor>[0];
    const mountedStack = (focused: string[], routeNames = ['(tabs)', 'index', 'reminder-settings']) => ({
        stale: false, type: 'stack', key: 'stack-1', index: focused.length - 1, routeNames, preloadedRoutes: [],
        routes: focused.map((name, i) => ({ key: `${name}-${i}`, name })),
    });

    /** Navigating now would replace the root layout and remount every provider. */
    it('waits while the root Stack has not registered its state', () => {
        expect(notificationNavigationFor(undefined)).toBeNull();
        expect(notificationNavigationFor(rootWith(undefined))).toBeNull();
    });

    it('waits on a partial state that no mounted navigator owns yet', () => {
        expect(notificationNavigationFor(rootWith({ stale: true, routes: [{ name: 'index' }] }))).toBeNull();
    });

    it('waits while the tabs are not a route of the root Stack', () => {
        expect(notificationNavigationFor(rootWith(mountedStack(['index'], ['index', '(onboarding)'])))).toBeNull();
    });

    it('replaces from inside the tabs, which switches tab', () => {
        expect(notificationNavigationFor(rootWith(mountedStack(['(tabs)'])))).toBe('replace');
    });

    /** A replace here would stack a second set of tabs on the first. */
    it('dismisses back to the tabs when a root-level screen is on top', () => {
        expect(notificationNavigationFor(rootWith(mountedStack(['(tabs)', 'reminder-settings'])))).toBe('dismissTo');
    });

    it('dismisses when the tabs are not in the stack yet, which puts them in place', () => {
        expect(notificationNavigationFor(rootWith(mountedStack(['index'])))).toBe('dismissTo');
    });
});
