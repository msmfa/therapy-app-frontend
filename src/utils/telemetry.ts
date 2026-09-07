import type { ErrorEvent } from '@sentry/react-native';

export const API_FAILURE_MESSAGE = 'API request failed';

/** Health app diagnostics contain route/method information, never HTTP payloads. */
export function sanitizeTelemetry(event: ErrorEvent): ErrorEvent {
    if (event.request) {
        const { method, url } = event.request;
        event.request = { method, ...(url ? { url: url.split(/[?#]/, 1)[0] } : {}) };
    }
    delete event.user;
    // ApiErrors may also be captured by callers, including as a linked cause.
    // Sentry serializes Error.message into exception values, independently of
    // request bodies and sendDefaultPii. Preserve the diagnostic stack/type.
    const isApiError = event.tags?.['api.method'] !== undefined
        || event.exception?.values?.some((exception) => exception.type === 'ApiError');
    if (isApiError) {
        if (event.message !== undefined) event.message = API_FAILURE_MESSAGE;
        if (event.exception?.values) {
            event.exception.values = event.exception.values.map((exception) => ({
                ...exception,
                value: API_FAILURE_MESSAGE,
            }));
        }
    }
    event.breadcrumbs = event.breadcrumbs?.map(({ data: _data, ...breadcrumb }) => ({
        ...breadcrumb,
        ...(breadcrumb.category === 'http' ? { message: 'HTTP request' } : {}),
        // Console breadcrumbs can stringify the same body-derived errors.
        ...(breadcrumb.category === 'console' ? { message: 'Console message' } : {}),
    }));
    return event;
}
