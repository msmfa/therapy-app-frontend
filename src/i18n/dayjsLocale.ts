/**
 * Points dayjs at the language the app is showing.
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
 */
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';

import { languageSubtag } from './resolve';

dayjs.extend(localizedFormat);

/** The tags dayjs has data bundled for, beyond its built-in English. */
const BUNDLED = new Set(['fr']);

export const applyDayjsLocale = (language: string): void => {
    const subtag = languageSubtag(language);
    // An unbundled language falls back to English rather than throwing, which
    // matches how the resource files behave.
    dayjs.locale(BUNDLED.has(subtag) ? subtag : 'en');
};
