/**
 * Minimal IANA time-zone arithmetic built on Intl, so reminders can be placed
 * at a wall-clock hour in the user's own zone.
 *
 * This exists instead of dayjs's timezone plugin because that plugin resolves a
 * zone offset by round-tripping through `new Date(date.toLocaleString('en-US',
 * { timeZone }))`. Hermes returns `Invalid Date` for that string, so the offset
 * came out as garbage derived from the current clock, and every reminder was
 * shifted by however many minutes past the hour it happened to be. Nothing
 * failed loudly: the times were simply wrong, and only on device, which is why
 * the Node tests never saw it.
 *
 * `Intl.DateTimeFormat().formatToParts()` is supported on Hermes and is the
 * only primitive used here.
 *
 * Deliberately a port of the backend's src/utils/timeZone.ts. The two schedule
 * the same reminders and have to agree on what "20:00" means.
 */

export const UTC = 'UTC';

export interface ZonedParts {
    year: number;
    month: number; // 1-12
    day: number;
    hour: number;
    minute: number;
    second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
    const cached = formatterCache.get(timeZone);
    if (cached) return cached;

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    formatterCache.set(timeZone, formatter);
    return formatter;
};

export const isValidTimeZone = (timeZone?: string | null): timeZone is string => {
    if (!timeZone || typeof timeZone !== 'string') return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return true;
    } catch {
        return false;
    }
};

/** The requested zone, else the device zone, else UTC. */
export const resolveTimeZone = (timeZone?: string | null): string => {
    if (isValidTimeZone(timeZone)) return timeZone;

    try {
        const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (isValidTimeZone(device)) return device;
    } catch {
        // fall through
    }

    return UTC;
};

export const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
    const parts = getFormatter(timeZone).formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes): number => {
        const found = parts.find((part) => part.type === type);
        return found ? Number(found.value) : 0;
    };

    // Some platforms render midnight as hour 24; normalise it back to 0.
    const hour = read('hour') % 24;

    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
        hour,
        minute: read('minute'),
        second: read('second'),
    };
};

/** Zone offset at a given instant, in milliseconds east of UTC. */
const getOffsetMs = (date: Date, timeZone: string): number => {
    const parts = getZonedParts(date, timeZone);
    const asIfUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
    );
    return asIfUtc - Math.floor(date.getTime() / 1000) * 1000;
};

/**
 * The UTC instant at which the given wall-clock time occurs in `timeZone`.
 *
 * The offset is resolved twice because the first guess uses the offset in
 * effect at the UTC-interpreted instant, which can sit on the wrong side of a
 * DST transition.
 */
export const zonedTimeToUtc = (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timeZone: string,
): Date => {
    const naive = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

    const firstOffset = getOffsetMs(new Date(naive), timeZone);
    let result = new Date(naive - firstOffset);

    const secondOffset = getOffsetMs(result, timeZone);
    if (secondOffset !== firstOffset) {
        result = new Date(naive - secondOffset);
    }

    return result;
};

/** Midnight local time, as a UTC instant. */
export const startOfDayInZone = (date: Date, timeZone: string): Date => {
    const { year, month, day } = getZonedParts(date, timeZone);
    return zonedTimeToUtc(year, month, day, 0, 0, timeZone);
};

/** `hour`:00 local time on the local calendar day of `date`, as a UTC instant. */
export const setHourInZone = (date: Date, hour: number, timeZone: string): Date => {
    const { year, month, day } = getZonedParts(date, timeZone);
    return zonedTimeToUtc(year, month, day, hour, 0, timeZone);
};

/** `minutes`: local time from midnight on the day of `date`, as a UTC instant. */
export const setMinutesInZone = (date: Date, minutes: number, timeZone: string): Date => {
    const { year, month, day } = getZonedParts(date, timeZone);
    return zonedTimeToUtc(
        year,
        month,
        day,
        Math.floor(minutes / 60),
        minutes % 60,
        timeZone,
    );
};

/** Adds whole local days, keeping the wall-clock time stable across DST. */
export const addDaysInZone = (date: Date, days: number, timeZone: string): Date => {
    const parts = getZonedParts(date, timeZone);
    return zonedTimeToUtc(
        parts.year,
        parts.month,
        parts.day + days,
        parts.hour,
        parts.minute,
        timeZone,
    );
};

/** Whole local calendar days between two instants (never negative). */
export const calendarDaysBetweenInZone = (start: Date, end: Date, timeZone: string): number => {
    const startDay = startOfDayInZone(start, timeZone).getTime();
    const endDay = startOfDayInZone(end, timeZone).getTime();
    return Math.max(0, Math.round((endDay - startDay) / 86_400_000));
};

/** The local calendar day of an instant, as YYYY-MM-DD in `timeZone`. */
export const localDateKeyInZone = (date: Date, timeZone: string): string => {
    const { year, month, day } = getZonedParts(date, timeZone);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
};
