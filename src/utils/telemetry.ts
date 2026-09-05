import type { ErrorEvent } from '@sentry/react-native';

/** Health app diagnostics contain route/method information, never HTTP payloads. */
export function sanitizeTelemetry(event: ErrorEvent): ErrorEvent {
    if (event.request) {
        const { method, url } = event.request;
        event.request = { method, ...(url ? { url: url.split(/[?#]/, 1)[0] } : {}) };
    }
    delete event.user;
    event.breadcrumbs = event.breadcrumbs?.map(({ data: _data, ...breadcrumb }) => ({
        ...breadcrumb,
        ...(breadcrumb.category === 'http' ? { message: 'HTTP request' } : {}),
    }));
    return event;
}
