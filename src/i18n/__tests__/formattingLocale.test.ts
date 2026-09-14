/**
 * Region must survive the language becoming configurable.
 *
 * Before this feature every `Intl` call passed `undefined`, so dates and times
 * followed the platform, region included: a UK phone reads "Mon 14 Sep" and
 * "20:00". Passing the bare active language instead ("en") silently moves every
 * one of those users to US conventions, which no test in the app asserts
 * directly and which nobody would notice until a screenshot looked wrong.
 */

import type { formattingLocale as FormattingLocale, i18next as I18next } from '../index';

// A default return value matters: src/i18n/index.ts calls getLocales() at
// import time, to pick the language i18next initialises on, which happens
// before any test body can set one.
jest.mock('expo-localization', () => ({
    getLocales: jest.fn(() => [{ languageTag: 'en-GB', languageCode: 'en', regionCode: 'GB' }]),
}));

/**
 * A fresh instance, bound to the mocked expo-localization.
 *
 * jest.setup.js requires src/i18n so every component test has an initialised
 * i18next, which means the real module object is already cached by the time
 * this file's jest.mock registers. Resetting the registry and re-requiring is
 * what binds this copy to the mock instead of to the cached original.
 */
let formattingLocale: typeof FormattingLocale;
let i18next: typeof I18next;
let mockGetLocales: jest.Mock;

beforeAll(() => {
    jest.resetModules();
    // Same registry as the copy of src/i18n below, so setting a return value
    // here is visible to it. Reaching for the top-level import instead would
    // be a different jest.fn created by the factory on the first registry.
    mockGetLocales = (require('expo-localization') as { getLocales: jest.Mock }).getLocales;
    const isolated = require('../index') as typeof import('../index');
    formattingLocale = isolated.formattingLocale;
    i18next = isolated.i18next;
});

const mockLocales = (tags: { languageCode: string; regionCode: string | null }[]) => {
    mockGetLocales.mockReturnValue(
        tags.map((tag) => ({
            languageTag: tag.regionCode === null ? tag.languageCode : `${tag.languageCode}-${tag.regionCode}`,
            languageCode: tag.languageCode,
            regionCode: tag.regionCode,
        })),
    );
};

describe('formattingLocale', () => {
    afterEach(async () => {
        await i18next.changeLanguage('en');
    });

    it('defers to the platform when the app speaks the device language', async () => {
        // The important case: undefined, not "en". Anything else drops the
        // user's region.
        mockLocales([{ languageCode: 'en', regionCode: 'GB' }]);
        await i18next.changeLanguage('en');
        expect(formattingLocale()).toBeUndefined();

        mockLocales([{ languageCode: 'fr', regionCode: 'FR' }]);
        await i18next.changeLanguage('fr');
        expect(formattingLocale()).toBeUndefined();
    });

    it('keeps the device region when the user overrides the language', async () => {
        mockLocales([{ languageCode: 'en', regionCode: 'GB' }]);
        await i18next.changeLanguage('fr');
        expect(formattingLocale()).toBe('fr-GB');
    });

    it('falls back to the bare language when the device reports no region', async () => {
        mockLocales([{ languageCode: 'en', regionCode: null }]);
        await i18next.changeLanguage('fr');
        expect(formattingLocale()).toBe('fr');
    });

    it('falls back to the bare language when the device reports nothing at all', async () => {
        mockLocales([]);
        await i18next.changeLanguage('fr');
        expect(formattingLocale()).toBe('fr');
    });

    it('treats a regional device variant as its language', async () => {
        // fr-CA on the device, app on French: still the platform's own locale,
        // so Canadian conventions are preserved.
        mockLocales([{ languageCode: 'fr', regionCode: 'CA' }]);
        await i18next.changeLanguage('fr');
        expect(formattingLocale()).toBeUndefined();
    });
});
