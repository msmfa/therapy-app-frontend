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
 * Region only matters for English among the languages the app ships: dayjs's
 * fr, fr-ca and fr-ch are identical in both tokens, while en, en-gb, en-au and
 * en-ca disagree about the clock, the date order, or both. The regional locales
 * are imported statically because Metro cannot resolve a computed require, so
 * the set below is the coverage, and a region outside it falls back to its
 * language. Adding one is an import and a line in BUNDLED.
 */
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/en-gb';
import 'dayjs/locale/en-ie';
import 'dayjs/locale/en-au';
import 'dayjs/locale/en-nz';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/en-in';
import 'dayjs/locale/fr';
import 'dayjs/locale/fr-ca';
import 'dayjs/locale/fr-ch';

import { languageSubtag } from './resolve';

dayjs.extend(localizedFormat);

/**
 * The tags dayjs has data bundled for here, beyond its built-in `en`.
 *
 * dayjs keys its locales in lower case, which is not how a BCP 47 tag is
 * written, so everything is lowered before it is looked up.
 */
const BUNDLED = new Set([
    'en-gb', 'en-ie', 'en-au', 'en-nz', 'en-ca', 'en-in',
    'fr', 'fr-ca', 'fr-ch',
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
