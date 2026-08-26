import {
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
