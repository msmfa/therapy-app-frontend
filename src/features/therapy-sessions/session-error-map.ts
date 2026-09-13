import { ApiError } from '../../api/client';
import { t } from '../../i18n/translate';

export type SessionErrorKey = 'timeout' | 'unauthorized' | 'forbidden' | 'notFound' | 'rateLimited' | 'server' | 'maintenance' | 'network' | 'unknown';

export interface SessionErrorCopy {
    title: string;
    message: string;
    actionLabel?: string;
    retryable: boolean;
}

/**
 * Whether each failure is worth offering a retry for. Split from the words
 * because it is a property of the error, not of the language.
 */
const RETRYABLE: Record<SessionErrorKey, boolean> = {
    timeout: true,
    unauthorized: false,
    forbidden: false,
    notFound: false,
    rateLimited: true,
    server: true,
    maintenance: false,
    network: true,
    unknown: true,
};

function classifySessionError(error: unknown): SessionErrorKey {
    if (error instanceof ApiError) {
        switch (error.status) {
            case 0:
                // The API client maps transport-level failures (offline, DNS,
                // refused connections) to status 0 before callers see them,
                // so the raw-TypeError branch below never fires for requests
                // routed through it.
                return 'network';
            case 401:
                return 'unauthorized';
            case 403:
                return 'forbidden';
            case 404:
                return 'notFound';
            case 408:
                return 'timeout';
            case 429:
                return 'rateLimited';
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

/**
 * The words for a failure, resolved now.
 *
 * A function rather than the table of constants this used to be. The table was
 * evaluated at import time, before the stored language preference had been
 * read, so every message would have been fixed in the device's language for
 * the life of the process and would not have followed a change of setting.
 */
export function mapSessionError(error: unknown): SessionErrorCopy {
    const key = classifySessionError(error);
    const retryable = RETRYABLE[key];

    return {
        title: t(`calendar:error.${key}.title`),
        message: t(`calendar:error.${key}.message`),
        ...(retryable ? { actionLabel: t('common:action.tryAgain') } : {}),
        retryable,
    };
}
