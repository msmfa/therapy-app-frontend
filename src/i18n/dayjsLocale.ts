/**
 * Points dayjs at the locale the app is formatting in.
 *
 * dayjs defaults to English and its locale is global, not per-call, so without
 * this every weekday and month name the app renders through dayjs stayed
 * English however the interface was set: the plan timeline, the note cards,
 * the calendar tiles and the schedule sheet.
 *
 * Setting the locale fixes the *names*. It does not fix the clock convention,
 * because that is decided by the format token: `h:mm A` asks for 12-hour with
 * a day period whatever the locale, so French would have read "18:00" as
 * "6:00 PM". Call sites use `LT` instead, which is the locale's own time
 * format, and `LL` for a full date.
 *
 * This took the language and not the locale at first, which quietly sent every
 * British user to American conventions. dayjs's built-in `en` is US English:
 * `LT` is "6:00 PM" and `LL` is "September 14, 2026". A UK phone wants "18:00"
 * and "14 September 2026", and the difference lives entirely in the region,
 * which a bare "en" throws away. The app knows the region -- `formattingLocale()`
 * composes it -- so the whole tag comes in here now.
 *
 * Region changes the format tokens for English and for Spanish: en, en-gb,
 * en-au and en-ca disagree about the clock, the date order, or both, and es-us
 * is on a 12-hour clock where es and es-mx are on 24, so a Spanish-speaking US
 * device would otherwise have read 18:00 for six in the evening. es-mx matches
 * es and is carried because Mexico is the storefront the Spanish listing
 * targets. es-do and es-pr match es-us and are not carried, so those devices
 * fall back to es and get the 24-hour clock; add them here if that shows up.
 * fr agrees with its regions on both. German still earns its regions for a
 * different reason:
 * de-at writes January as "Jänner" where de writes "Januar", so an Austrian
 * device would otherwise read a month name no Austrian uses. de-ch matches de
 * and is carried only so the German set is not half-present. The regional
 * locales are imported statically because Metro cannot resolve a computed
 * require, so the set below is the coverage, and a region outside it falls back
 * to its language. Adding one is an import and a line in BUNDLED.
 */
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/en-gb';
import 'dayjs/locale/en-ie';
import 'dayjs/locale/en-au';
import 'dayjs/locale/en-nz';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/fr';
import 'dayjs/locale/fr-ca';
import 'dayjs/locale/fr-ch';
import 'dayjs/locale/de';
import 'dayjs/locale/de-at';
import 'dayjs/locale/de-ch';
import 'dayjs/locale/es';
import 'dayjs/locale/es-mx';
import 'dayjs/locale/es-us';

import { languageSubtag } from './resolve';

dayjs.extend(localizedFormat);
dayjs.extend(localeData);

/**
 * The tags dayjs has data bundled for here, beyond its built-in `en`.
 *
 * dayjs keys its locales in lower case, which is not how a BCP 47 tag is
 * written, so everything is lowered before it is looked up.
 */
const BUNDLED = new Set([
    'en-gb', 'en-ie', 'en-au', 'en-nz', 'en-ca', 'en-in',
    'fr', 'fr-ca', 'fr-ch',
    'de', 'de-at', 'de-ch',
    'es', 'es-mx', 'es-us',
]);

/** dayjs's own built-in, and the last resort. */
const FALLBACK = 'en';

/**
 * @param locale A full formatting locale such as "en-GB", not a language.
 */
export const applyDayjsLocale = (locale: string): void => {
    const tag = locale.toLowerCase();
    if (BUNDLED.has(tag)) {
        dayjs.locale(tag);
        return;
    }

    // An unbundled region falls back to its language, and an unbundled
    // language to English, rather than throwing. That matches how the resource
    // files behave and means a new device locale degrades rather than breaks.
    const language = languageSubtag(tag);
    dayjs.locale(BUNDLED.has(language) ? language : FALLBACK);
};

/**
 * The active locale's long date with the year dropped and the month shortened:
 * "15 Sep", "Sep 15", "15. Sep", "15 sept.".
 *
 * Built from the locale's own `LL` pattern rather than written out as a fixed
 * one. A hardcoded "D MMM" reads "15 Sep" to a British user, who writes it that
 * way, and the same "15 Sep" to an American, who writes "Sep 15"; German wants
 * the ordinal point after the day. Deriving from `LL` keeps each language's
 * own order and separators and only edits the two parts that were asked for.
 *
 * `LL` is `D MMMM YYYY`, `MMMM D, YYYY` or `D. MMMM YYYY` across every locale
 * bundled above, so the year is always trailing and takes its comma with it.
 */
export const shortDatePattern = (): string =>
    dayjs
        .localeData()
        .longDateFormat('LL')
        .replace('MMMM', 'MMM')
        .replace(/,?\s*YYYY/, '')
        .trim();
