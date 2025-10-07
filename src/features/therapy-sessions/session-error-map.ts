import { ApiError } from '../../api/client';

export type SessionErrorKey = 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'server' | 'maintenance' | 'network' | 'unknown';

export interface SessionErrorCopy {
    title: string;
    message: string;
    actionLabel?: string;
    retryable: boolean;
}

const SESSION_ERROR_COPY: Record<SessionErrorKey, SessionErrorCopy> = {
    timeout: {
        title: 'Connection timed out',
        message: 'We could not reach your therapy schedule. Check your connection and try again.',
        actionLabel: 'Try again',
        retryable: true,
    },
    unauthorized: {
        title: 'Sign in to continue',
        message: 'Your session expired. Sign in again to load your therapy reminders.',
        retryable: false,
    },
    forbidden: {
        title: 'Access denied',
        message: 'Your account no longer has access to these sessions. Contact support if this is unexpected.',
        retryable: false,
    },
    notFound: {
        title: 'No sessions found',
        message: 'We couldn’t find upcoming therapy sessions. Add new sessions to see reminders here.',
        retryable: false,
    },
    server: {
        title: 'Service unavailable',
        message: 'We’re having trouble loading sessions right now. Try again in a moment.',
        actionLabel: 'Try again',
        retryable: true,
    },
    maintenance: {
        title: 'Feature temporarily offline',
        message: 'We’re updating the therapy reminders feature. Check back shortly.',
        retryable: false,
    },
    network: {
        title: 'No internet connection',
        message: 'You appear to be offline. Reconnect to the internet and try again.',
        actionLabel: 'Try again',
        retryable: true,
    },
    unknown: {
        title: 'Something went wrong',
        message: 'We couldn’t load your therapy sessions. Please try again later.',
        actionLabel: 'Try again',
        retryable: true,
    },
};

function classifySessionError(error: unknown): SessionErrorKey {
    if (error instanceof ApiError) {
        switch (error.status) {
            case 401:
                return 'unauthorized';
            case 403:
                return 'forbidden';
            case 404:
                return 'notFound';
            case 408:
                return 'timeout';
            case 423:
            case 503:
                return 'maintenance';
            default:
                return error.status >= 500 ? 'server' : 'unknown';
        }
    }

    if (error instanceof TypeError && error.message === 'Network request failed') {
        return 'network';
    }

    return 'unknown';
}

export function mapSessionError(error: unknown): SessionErrorCopy {
    const key = classifySessionError(error);
    return SESSION_ERROR_COPY[key];
}
