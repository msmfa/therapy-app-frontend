/**
 * i18next, initialised synchronously at import time.
 *
 * Synchronous on purpose. Resources are static JSON bundled by Metro rather
 * than fetched, so the first render already has real copy and no screen ever
 * flashes raw keys. The only asynchronous part is reading the stored override,
 * which `hydrateLanguage` does behind the LanguageGate, before the first screen
 * mounts.
 */

// Must come before i18next is imported: i18next builds plural rules with
// `new Intl.PluralRules(...)` and, when that throws, silently substitutes a
// rule that always answers "other". Hermes does not implement PluralRules on
// either platform (verified on an iOS 17.4 simulator: Intl.NumberFormat,
// DateTimeFormat, Collator and getCanonicalLocales are all present, PluralRules
// is undefined), so without this polyfill every `_one` form would be dead code
// and nothing would throw. That is the same failure shape as the Hermes
// time-zone bug documented in utils/timeZone.ts: plausible output, wrong, and
// invisible to tests running under Node's full ICU.
import '@formatjs/intl-pluralrules/polyfill-force.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';

import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LANGUAGE, RESOURCES } from './languages';
import { readLanguagePreference } from './storage';
import {
    languageSubtag,
    resolveLanguage,
    SYSTEM_PREFERENCE,
    type LanguagePreference,
} from './resolve';
import { applyDayjsLocale } from './dayjsLocale';

/** Kept in step with `CustomTypeOptions['defaultNS']` in i18next.d.ts. */
const DEFAULT_NAMESPACE = 'common';

/** The device's preferred language tags, most preferred first. */
export const deviceLanguageTags = (): string[] =>
    getLocales().map((locale) => locale.languageTag);

void i18next.use(initReactI18next).init({
    resources: RESOURCES,
    // Start on the device's language. `hydrateLanguage` corrects this to a
    // stored override before the first screen is shown.
    lng: resolveLanguage(SYSTEM_PREFERENCE, deviceLanguageTags()),
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: DEFAULT_NAMESPACE,
    // Resources are bundled, so there is nothing to wait for. Without this,
    // i18next defers loading into a setTimeout and the first `t()` call can run
    // before init has finished, which is exactly the flash of untranslated text
    // this setup exists to avoid. (Named `initImmediate` before i18next 26.)
    initAsync: false,
    interpolation: {
        // React escapes for us; i18next doing it again turns an apostrophe in
        // a French string into "&#39;".
        escapeValue: false,
    },
    returnNull: false,
});

/**
 * The locale to format dates, times, numbers and currency in.
 *
 * `undefined` on purpose whenever the app is showing the language the device
 * already asked for. `undefined` means "use the platform's own locale", which
 * carries the user's *region* as well as their language: a UK phone formats
 * dates as "Mon 14 Sep" and times as "20:00", and forcing a bare "en" would
 * quietly move every one of those users to "Mon, Sep 14" and "8:00 PM".
 * Region is not something this app asks about, so the platform is the only
 * place that knows it.
 *
 * An explicit tag is returned only when the user has overridden the language,
 * which is the one case where the platform's locale is the wrong answer. Even
 * then the device's region is kept where it is known, so someone reading
 * English in France still gets day-before-month dates.
 */
export const formattingLocale = (): string | undefined => {
    const [device] = getLocales();
    const deviceLanguage = device?.languageCode ?? device?.languageTag;

    const language = languageSubtag(i18next.language);

    if (deviceLanguage != null && languageSubtag(deviceLanguage) === language) {
        return undefined;
    }

    const region = device?.regionCode;
    return region == null ? language : `${language}-${region}`;
};

/**
 * Apply the stored override, if there is one.
 *
 * Awaited before the first screen renders so a user who chose Français never
 * sees a frame of English.
 */
export const hydrateLanguage = async (): Promise<LanguagePreference> => {
    const preference = await readLanguagePreference();
    const language = resolveLanguage(preference, deviceLanguageTags());
    if (i18next.language !== language) {
        await i18next.changeLanguage(language);
    }
    return preference;
};

// dayjs keeps one global locale, so it has to be told whenever i18next moves.
// Subscribing here rather than in a component means every consumer of dayjs is
// covered, including the ones with no React around them.
applyDayjsLocale(i18next.language);
i18next.on('languageChanged', applyDayjsLocale);

export { i18next };
