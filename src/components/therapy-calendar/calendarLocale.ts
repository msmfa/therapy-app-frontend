/**
 * Month and weekday names for react-native-calendars.
 *
 * The library does not use Intl. It keeps its own table of names in
 * `LocaleConfig` and ships English alone, so a French app would have had a
 * French interface wrapped around an English calendar header, which is the one
 * place a user would see both languages at once.
 *
 * The names are generated from Intl rather than typed out, so a third language
 * needs nothing here: the tag is the only input, and the data comes from the
 * platform that is already formatting every other date in the app. Verified on
 * Hermes, which carries full locale data for DateTimeFormat.
 */
import { LocaleConfig } from 'react-native-calendars';

/**
 * The shape this module writes into.
 *
 * react-native-calendars ships no usable type for LocaleConfig, so without a
 * local one every access here is an `any` the lint rules reject. Narrow rather
 * than cast-to-any: the fields below are the whole contract, and naming them
 * means a change in the library shows up as a type error instead of silently.
 */
type CalendarLocale = {
    monthNames: string[];
    monthNamesShort: string[];
    dayNames: string[];
    dayNamesShort: string[];
};

const config = LocaleConfig as unknown as {
    locales: Record<string, CalendarLocale | undefined>;
    defaultLocale: string;
};

// Any Monday. Only the weekday matters, and starting on a Monday means index 0
// is Sunday after the rotation below, which is the order the library expects.
const WEEK_START = Date.UTC(2024, 0, 7); // a Sunday
const DAY_MS = 24 * 60 * 60 * 1000;

const monthNames = (locale: string, month: 'long' | 'short'): string[] =>
    Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { month, timeZone: 'UTC' })
            .format(Date.UTC(2024, index, 15)),
    );

const dayNames = (locale: string, weekday: 'long' | 'short'): string[] =>
    Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { weekday, timeZone: 'UTC' })
            .format(WEEK_START + index * DAY_MS),
    );

/**
 * Point the calendar at a language, registering it the first time it is asked
 * for. Safe to call on every render and on every language change.
 */
export const applyCalendarLocale = (tag: string): void => {
    // A required string, not an optional one. This used to fall back to
    // `new Intl.DateTimeFormat().resolvedOptions().locale` when given
    // `undefined`, on the reading that it meant "the platform's own locale".
    // On Hermes that resolves to "en-GB" whatever the app language is, which
    // is exactly how a French app came to have an English calendar header.
    if (config.locales[tag] === undefined) {
        try {
            config.locales[tag] = {
                monthNames: monthNames(tag, 'long'),
                monthNamesShort: monthNames(tag, 'short'),
                dayNames: dayNames(tag, 'long'),
                dayNamesShort: dayNames(tag, 'short'),
            };
        } catch {
            // A tag Intl rejects leaves the library on whatever it had, which
            // is English. A calendar in the wrong language beats no calendar.
            return;
        }
    }

    config.defaultLocale = tag;
};
