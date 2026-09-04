/**
 * Locale-aware date and time strings for the onboarding flow.
 *
 * `Intl.DateTimeFormat` is used rather than a fixed pattern so the user's own
 * conventions decide the order of the parts and whether times read as 12 or 24
 * hour. `formatToParts` is already relied on elsewhere in the app (see
 * utils/timeZone.ts), so it is known to work on Hermes.
 */

const safeFormat = (date: Date, options: Intl.DateTimeFormatOptions, fallback: string): string => {
    try {
        return new Intl.DateTimeFormat(undefined, options).format(date);
    } catch {
        return fallback;
    }
};

/** "Tuesday" in the device locale. */
export const weekdayName = (date: Date): string =>
    safeFormat(date, { weekday: 'long' }, date.toDateString());

/**
 * "20:00" or "8:00 pm", following the device's clock convention.
 *
 * The digits come from the Date, never from the formatter. Intl is used only
 * for the parts around them: the separator, the order, and whether there is a
 * day period. This app has already been bitten once by an Intl call that
 * returns a plausible but wrong answer on Hermes and the right one under
 * Node's full ICU (see utils/timeZone.ts), which is a failure no unit test on
 * a laptop can see. A clock that quietly reads 0:00 whatever the user picked
 * is that same shape of bug, so the hour and minute are taken from the value
 * itself and only the presentation is delegated.
 */
export const timeLabel = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';

    const minuteText = String(minutes).padStart(2, '0');

    try {
        const parts = new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        }).formatToParts(date);

        const hourPart = parts.find((part) => part.type === 'hour');
        if (hourPart === undefined) throw new Error('no hour part');

        const twelveHour = parts.some((part) => part.type === 'dayPeriod');
        const hour = twelveHour ? (hours % 12 === 0 ? 12 : hours % 12) : hours;
        // Follow the locale's own choice about padding the hour.
        const hourText = hourPart.value.length > 1 && hourPart.value.startsWith('0')
            ? String(hour).padStart(2, '0')
            : String(hour);

        return parts
            .map((part) => {
                if (part.type === 'hour') return hourText;
                if (part.type === 'minute') return minuteText;
                return part.value;
            })
            .join('');
    } catch {
        return `${String(hours).padStart(2, '0')}:${minuteText}`;
    }
};

/** "Tue 4 Mar" — short enough for a timeline row, still unambiguous. */
export const shortDateLabel = (date: Date): string =>
    safeFormat(
        date,
        { weekday: 'short', day: 'numeric', month: 'short' },
        date.toDateString(),
    );

/** "Tuesday 4 March 2026" for the date field. */
export const longDateLabel = (date: Date): string =>
    safeFormat(
        date,
        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        date.toDateString(),
    );

/** "Tue 4 Mar, 20:00" for a timeline entry that needs both. */
export const dateTimeLabel = (date: Date): string =>
    `${shortDateLabel(date)}, ${timeLabel(date)}`;

/**
 * Several occurrences of the same reminder, as one line.
 *
 * The spaced reviews all land at the user's evening time, so the time is stated
 * once at the end rather than repeated after every date. If a caller ever passes
 * occurrences at different times, each is labelled in full instead.
 */
export const occurrencesLabel = (dates: Date[]): string => {
    if (dates.length === 0) return '';
    if (dates.length === 1) return dateTimeLabel(dates[0]);

    const time = timeLabel(dates[0]);
    const sameTime = dates.every((date) => timeLabel(date) === time);

    if (!sameTime) {
        return dates.map(dateTimeLabel).join(', ');
    }

    return `${dates.map(shortDateLabel).join(', ')}, ${time}`;
};

/** Minutes from local midnight, as carried in the onboarding answers. */
export const minutesToDate = (minutes: number, on: Date = new Date()): Date => {
    const next = new Date(on);
    next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return next;
};

export const dateToMinutes = (date: Date): number => date.getHours() * 60 + date.getMinutes();
