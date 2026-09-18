import { ApiError } from '../../api/client';
import en from '../../i18n/locales/en.json';
import { t } from '../../i18n/translate';

/**
 * The sentence to show a user for a failure that came from the server.
 *
 * The API sends prose, which a client cannot translate, alongside a stable
 * `code`, which it can. Before this existed the app showed the prose, so a
 * French interface reported its failures in English: a French alert title over
 * an English body, in the same dialog.
 *
 * The server's own message stays the fallback rather than being discarded. An
 * unrecognised code still produces a readable sentence, which matters in three
 * cases that all really happen: a backend newer than the app, a code nobody has
 * written copy for yet, and the validation errors whose text names a specific
 * field and so says more than any fixed translation could.
 *
 * The API client also wraps transport failures: network errors have the
 * `network` code, while request aborts have status 408 and no code. Plain
 * Errors keep their message, since it may contain useful caller-specific
 * copy; only missing messages need the generic fallback.
 */

/**
 * The codes this build has copy for, taken from the resource file itself so
 * the two cannot drift. Typed as the literal keys rather than `string`, which
 * is what lets `t()` keep checking the key it is handed.
 */
type ServerErrorCode = keyof typeof en.serverError;

const TRANSLATED_CODES: ReadonlySet<string> = new Set(Object.keys(en.serverError));

export const isTranslatedServerCode = (code: unknown): code is ServerErrorCode =>
    typeof code === 'string' && TRANSLATED_CODES.has(code);

export const serverErrorMessage = (error: unknown, fallback?: string): string => {
    if (error instanceof ApiError) {
        if (isTranslatedServerCode(error.code)) {
            return t(`serverError:${error.code}`);
        }

        // The client's AbortError wrapper has no code. Do not let a status
        // fallback erase a more specific, unfamiliar server code's message.
        if (error.status === 408 && error.code === undefined) {
            return t('serverError:request_timeout');
        }
    }

    // No code, or one this build does not know: the server's own words are
    // better than a generic line, and are what the app showed before.
    if (error instanceof Error && error.message.trim() !== '') {
        return error.message;
    }

    return fallback ?? t('serverError:server_error');
};

/**
 * The same thing for a payload the caller has already unwrapped, where the
 * `ApiError` is no longer to hand.
 */
export const serverMessageForCode = (code: unknown, serverMessage?: string): string => {
    if (isTranslatedServerCode(code)) {
        return t(`serverError:${code}`);
    }

    return serverMessage?.trim() ? serverMessage : t('serverError:server_error');
};
