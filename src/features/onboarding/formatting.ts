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

/** "20:00" or "8:00 pm", following the device's clock convention. */
export const timeLabel = (date: Date): string =>
    safeFormat(date, { hour: 'numeric', minute: '2-digit' }, date.toTimeString().slice(0, 5));

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
