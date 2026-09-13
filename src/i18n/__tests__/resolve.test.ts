import {
    languageSubtag,
    parsePreference,
    resolveDeviceLanguage,
    resolveLanguage,
    SYSTEM_PREFERENCE,
} from '../resolve';

describe('languageSubtag', () => {
    it.each([
        ['fr-CA', 'fr'],
        ['fr-FR', 'fr'],
        ['FR-ca', 'fr'],
        // POSIX-style separators arrive from some devices.
        ['fr_CA', 'fr'],
        ['  en-GB ', 'en'],
        ['zh-Hans-CN', 'zh'],
    ])('reduces %s to %s', (tag, expected) => {
        expect(languageSubtag(tag)).toBe(expected);
    });
});

describe('resolveDeviceLanguage', () => {
    it('matches on the language subtag, so regional variants resolve', () => {
        expect(resolveDeviceLanguage(['fr-CA'])).toBe('fr');
        expect(resolveDeviceLanguage(['fr-FR'])).toBe('fr');
    });

    it('falls back to English when nothing is translated', () => {
        expect(resolveDeviceLanguage(['de-DE', 'it-IT'])).toBe('en');
    });

    it('falls back to English for an empty device list', () => {
        expect(resolveDeviceLanguage([])).toBe('en');
    });

    it('walks the whole preference order rather than only the first entry', () => {
        // Someone whose first language the app does not ship, but whose second
        // it does, should get their second rather than English.
        expect(resolveDeviceLanguage(['br-FR', 'fr-FR', 'en-GB'])).toBe('fr');
    });
});

describe('resolveLanguage', () => {
    it('follows the device when the preference is System', () => {
        expect(resolveLanguage(SYSTEM_PREFERENCE, ['fr-FR'])).toBe('fr');
        expect(resolveLanguage(SYSTEM_PREFERENCE, ['en-US'])).toBe('en');
    });

    it('ignores the device when the user chose explicitly', () => {
        // The distinction the whole feature turns on: choosing English on a
        // French phone must stay English.
        expect(resolveLanguage('en', ['fr-FR'])).toBe('en');
        expect(resolveLanguage('fr', ['en-US'])).toBe('fr');
    });
});

describe('parsePreference', () => {
    it('treats a missing value as System', () => {
        expect(parsePreference(null)).toBe(SYSTEM_PREFERENCE);
    });

    it('round-trips System', () => {
        expect(parsePreference('system')).toBe(SYSTEM_PREFERENCE);
    });

    it('keeps a supported tag', () => {
        expect(parsePreference('fr')).toBe('fr');
    });

    it('falls back to System for a language the build no longer ships', () => {
        // A stored 'de' from a release that had German must not pin the user to
        // a language this build cannot render.
        expect(parsePreference('de')).toBe(SYSTEM_PREFERENCE);
        expect(parsePreference('')).toBe(SYSTEM_PREFERENCE);
    });
});
