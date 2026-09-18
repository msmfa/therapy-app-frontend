/**
 * The languages the app ships, and the only file that needs editing to add one.
 *
 * Adding a third language is two steps:
 *   1. Copy `locales/en.json` to `locales/<tag>.json` and translate the values.
 *   2. Import it below and add one `LANGUAGES` entry.
 *
 * Nothing else in the app enumerates languages: the settings picker, the
 * resolver, the resource bundle and the parity test all read this list.
 */

import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

/** The language English falls back to, and the source of truth for keys. */
export const FALLBACK_LANGUAGE = 'en';

/**
 * One shipped language.
 *
 * `endonym` is the name in that language itself, because a French speaker
 * looking for their language scans for "Français", not "French". It is
 * deliberately not translated per active language for the same reason: the
 * list should read the same whatever the app is currently showing.
 */
export type LanguageDefinition = {
    readonly tag: string;
    readonly endonym: string;
    readonly resources: Record<string, Record<string, unknown>>;
};

export const LANGUAGES = [
    { tag: 'en', endonym: 'English', resources: en },
    { tag: 'fr', endonym: 'Français', resources: fr },
    { tag: 'de', endonym: 'Deutsch', resources: de },
] as const satisfies readonly LanguageDefinition[];

/** A tag the app has translations for. */
export type LanguageTag = (typeof LANGUAGES)[number]['tag'];

export const SUPPORTED_TAGS: readonly LanguageTag[] = LANGUAGES.map((language) => language.tag);

export const isSupportedTag = (value: string): value is LanguageTag =>
    SUPPORTED_TAGS.includes(value as LanguageTag);

export const endonymFor = (tag: LanguageTag): string =>
    LANGUAGES.find((language) => language.tag === tag)?.endonym ?? tag;

/** The `{ [lng]: { [namespace]: … } }` shape i18next wants for `resources`. */
export const RESOURCES = Object.fromEntries(
    LANGUAGES.map((language) => [language.tag, language.resources]),
);
