import type { NavigationState } from '@react-navigation/native';
import type { Href } from 'expo-router';

/**
 * The home tab is the note composer; the notes tab is the list of notes
 * already written. The two reminder kinds want different ones of these.
 */
export const NOTE_COMPOSER_ROUTE = '/(tabs)' as const;
export const NOTES_LIST_ROUTE = '/(tabs)/notes' as const;

/**
 * The `kind` the backend puts on a reminder push. Kept as a bare string check
 * rather than a shared type because the two repos ship independently: a client
 * must cope with a value it has never heard of, not fail to compile against it.
 */
const REVIEW_NOTE_KIND = 'review_note';

/**
 * Where tapping a notification should land.
 *
 * `data` arrives from the push payload, so it is genuinely unknown: it may be
 * absent entirely on notifications sent before routing existed, and it is not
 * something the app controls. Anything unrecognised falls back to the composer,
 * which is where every notification went before this existed, so an unexpected
 * payload degrades to the old behaviour instead of stranding the user.
 */
export function resolveNotificationRoute(data: unknown): Href {
    if (typeof data === 'object' && data !== null) {
        const { kind } = data as { kind?: unknown };
        if (kind === REVIEW_NOTE_KIND) {
            return NOTES_LIST_ROUTE;
        }
    }

    return NOTE_COMPOSER_ROUTE;
}

/** The root layout's route for the paid app, where every notification lands. */
const TABS_ROUTE_NAME = '(tabs)';

/**
 * How a tap gets to its destination, given the navigation state at that moment.
 *
 * - `null`: the root layout's Stack has not registered with the navigation
 *   container yet, as on a cold start in the same commit that mounts it. A
 *   navigation then finds nothing below the container to target and replaces
 *   the root layout itself, remounting every provider. Wait for the Stack.
 * - `replace`: a tab is showing. Inside the tabs a replace switches tab.
 * - `dismissTo`: a root-level screen such as Reminder settings is on top of the
 *   tabs. A replace would swap that screen for a second set of tabs stacked on
 *   the first. Dismissing back to the existing tabs takes the target tab along.
 */
export type NotificationNavigation = 'replace' | 'dismissTo';

export function notificationNavigationFor(rootState: NavigationState | undefined): NotificationNavigation | null {
    // The container holds a single route for the root layout, and the layout's
    // Stack keeps its state on that route.
    const stack = rootState?.routes[rootState.index]?.state;
    // A partial state, as built from a launch URL, is not a mounted navigator.
    if (stack?.stale !== false || !stack.routeNames.includes(TABS_ROUTE_NAME)) {
        return null;
    }

    return stack.routes[stack.index]?.name === TABS_ROUTE_NAME ? 'replace' : 'dismissTo';
}
