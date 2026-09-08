import * as Sentry from '@sentry/react-native';
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

const HANDLED_FAILURE_STAGES: Record<string, readonly string[]> = {
    store: ['purchase', 'trial_eligibility', 'load_offer', 'verify_transaction', 'restore'],
    onboarding_notifications: ['read_permission', 'request_permission'],
    onboarding: ['complete'],
    onboarding_draft: ['write', 'clear', 'claim', 'promote'],
};
const HANDLED_FAILURE_REASONS = new Set(['not_configured', 'network', 'store_error']);

/** Reports handled failures by approved stage, never by native error content. */
export const reportHandledFailure = (
    area: string,
    stage: string,
    _error: unknown,
    context?: Record<string, string | number | boolean | null>,
): void => {
    try {
        const approved = Object.prototype.hasOwnProperty.call(HANDLED_FAILURE_STAGES, area)
            && HANDLED_FAILURE_STAGES[area].includes(stage);
        const safeArea = approved ? area : 'handled';
        const safeStage = approved ? stage : 'unknown';
        Sentry.withScope((scope) => {
            scope.setTag(`${safeArea}.stage`, safeStage);
            const reason = context?.reason;
            if (typeof reason === 'string' && HANDLED_FAILURE_REASONS.has(reason)) {
                scope.setContext(safeArea, { reason });
            }
            scope.setFingerprint([safeArea, safeStage]);
            // A native Error (or its cause/code/stack) can embed a receipt or
            // account data. Capture a new diagnostic at the handled call site.
            Sentry.captureException(new Error(`${safeArea} ${safeStage} failed`));
        });
    } catch {
        // Diagnostics must never strand a StoreKit waiter or a storage action.
    }
};
