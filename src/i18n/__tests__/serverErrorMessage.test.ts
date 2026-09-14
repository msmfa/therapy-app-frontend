/**
 * Server failures, said in the user's language.
 *
 * The fallback cases matter more than the happy ones. This sits in front of
 * every alert body the API produces, so getting it wrong replaces a useful
 * English sentence with nothing.
 */

import { ApiError } from '../../api/client';
import { serverErrorMessage, serverMessageForCode, isTranslatedServerCode } from '../../features/errors/serverErrorMessage';
import { i18next } from '../index';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const apiError = (status: number, payload: { message: string; code?: string }) =>
    new ApiError(status, payload);

describe('serverErrorMessage', () => {
    afterEach(async () => { await i18next.changeLanguage('en'); });

    it('translates a code it knows, ignoring the server prose', async () => {
        await i18next.changeLanguage('fr');
        const error = apiError(401, { message: 'Invalid credentials', code: 'invalid_credentials' });

        expect(serverErrorMessage(error)).toBe(fr.serverError.invalid_credentials);
        expect(serverErrorMessage(error)).not.toContain('Invalid credentials');
    });

    it('says the same thing in English', () => {
        const error = apiError(401, { message: 'Invalid credentials', code: 'invalid_credentials' });
        expect(serverErrorMessage(error)).toBe(en.serverError.invalid_credentials);
    });

    it('keeps the server prose for a code this build does not know', async () => {
        // A backend newer than the app. Falling back to a generic line here
        // would lose information the server went to the trouble of sending.
        await i18next.changeLanguage('fr');
        const error = apiError(400, { message: 'Some very specific new problem', code: 'invented_later' });

        expect(serverErrorMessage(error)).toBe('Some very specific new problem');
    });

    it('keeps the server prose when there is no code at all', async () => {
        await i18next.changeLanguage('fr');
        const error = apiError(400, { message: 'morningReminderMinutes must be a whole number' });

        expect(serverErrorMessage(error)).toBe('morningReminderMinutes must be a whole number');
    });

    it('flattens a validation failure to one translated sentence', async () => {
        // A deliberate trade. The server's text names the field, but the names
        // are internal identifiers ("morningReminderMinutes must be a whole
        // number"), so the detail it adds is not detail a user can act on, and
        // showing it untranslated is worse than losing it. The validation
        // messages that are genuinely user-meaningful, the appointment date
        // bounds in particular, already have their own copy on the screens
        // that can hit them.
        await i18next.changeLanguage('fr');
        const error = apiError(400, { message: 'locale must be a valid BCP-47 language tag', code: 'validation_failed' });

        expect(serverErrorMessage(error)).toBe(fr.serverError.validation_failed);
    });

    it('falls back to the caller’s own copy for a thrown non-Error', async () => {
        await i18next.changeLanguage('fr');
        expect(serverErrorMessage(null, 'repli')).toBe('repli');
    });

    it('uses the generic line when there is nothing else at all', async () => {
        await i18next.changeLanguage('fr');
        expect(serverErrorMessage(undefined)).toBe(fr.serverError.server_error);
    });

    it('passes a plain Error through, since it carries no code', () => {
        expect(serverErrorMessage(new TypeError('Network request failed')))
            .toBe('Network request failed');
    });
});

describe('serverMessageForCode', () => {
    afterEach(async () => { await i18next.changeLanguage('en'); });

    it('translates an unwrapped code', async () => {
        await i18next.changeLanguage('fr');
        expect(serverMessageForCode('password_reset_requested'))
            .toBe(fr.serverError.password_reset_requested);
    });

    it('keeps the server message for an unknown code', () => {
        expect(serverMessageForCode('who_knows', 'server said this')).toBe('server said this');
    });
});

describe('isTranslatedServerCode', () => {
    it('recognises every code the resource file carries', () => {
        for (const code of Object.keys(en.serverError)) {
            expect(isTranslatedServerCode(code)).toBe(true);
        }
    });

    it('rejects anything else', () => {
        expect(isTranslatedServerCode('nope')).toBe(false);
        expect(isTranslatedServerCode(undefined)).toBe(false);
        expect(isTranslatedServerCode(404)).toBe(false);
    });
});
