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
