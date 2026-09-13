/**
 * Turning a stored preference and a device locale into the language to show.
 *
 * Pure and dependency-free so the rules can be tested directly, without a
 * device, an i18next instance or AsyncStorage.
 */

import { FALLBACK_LANGUAGE, isSupportedTag, type LanguageTag } from './languages';

/**
 * What the user chose, as persisted.
 *
 * `'system'` is a real stored state rather than the absence of one. Someone on
 * System who changes their iPhone language must follow it; someone who picked
 * English must stay on English even on a French phone. Those two are
 * indistinguishable if "follow the device" is represented by an empty slot.
 */
export type LanguagePreference = 'system' | LanguageTag;

export const SYSTEM_PREFERENCE = 'system';

/**
 * The language subtag of a BCP-47 tag, lowercased.
 *
 * `fr-CA` and `fr-FR` both have to land on `fr`, and devices report tags in
 * whatever case and separator they like ('fr_CA', 'FR-ca'), so the subtag is
 * taken by splitting rather than by matching the whole string.
 */
export const languageSubtag = (tag: string): string =>
    tag.trim().toLowerCase().split(/[-_]/)[0] ?? '';

/**
 * The first device language the app has translations for.
 *
 * `getLocales()` is ordered by the user's own preference, so a device listing
 * Breton then French should get French rather than English: the whole list is
 * walked, not just the first entry.
 */
export const resolveDeviceLanguage = (deviceTags: readonly string[]): LanguageTag => {
    for (const tag of deviceTags) {
        const subtag = languageSubtag(tag);
        if (isSupportedTag(subtag)) return subtag;
    }
    return FALLBACK_LANGUAGE;
};

/** The language to render, given the stored preference and the device. */
export const resolveLanguage = (
    preference: LanguagePreference,
    deviceTags: readonly string[],
): LanguageTag =>
    preference === SYSTEM_PREFERENCE
        ? resolveDeviceLanguage(deviceTags)
        : preference;

/**
 * A persisted value read back, or `'system'` if it is missing or no longer
 * shipped.
 *
 * A tag can stop being supported between releases, and a stored `'de'` that no
 * longer has a file must not pin the user to a language the app cannot render.
 */
export const parsePreference = (stored: string | null): LanguagePreference => {
    if (stored === null) return SYSTEM_PREFERENCE;
    if (stored === SYSTEM_PREFERENCE) return SYSTEM_PREFERENCE;
    return isSupportedTag(stored) ? stored : SYSTEM_PREFERENCE;
};
