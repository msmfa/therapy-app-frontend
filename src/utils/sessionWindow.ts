/**
 * The one place that decides how far into the future the app will look.
 *
 * Two horizons have to agree, and previously did not. Onboarding projects a
 * recurring series six months out from the first session, while the calendar
 * only fetches and edits a year from today. A first session far enough ahead
 * therefore produced backend records that the calendar never requested, so the
 * user could not see them, edit them, or delete them. Deriving both from the
 * constants here is what keeps the bound and the window from drifting apart.
 */

/** How far a projected series runs from its first session. */
export const SERIES_MONTHS_AHEAD = 6;

/** How far ahead the calendar fetches and allows editing. */
export const CALENDAR_YEARS_AHEAD = 1;

/**
 * Calendar-month arithmetic, clamped to the end of a shorter month.
 *
 * 31 August plus six months is the last day of February, not the second or
 * third of March, which is where naive `setMonth` overflow lands. Matches how
 * the session series itself steps through months, so the two cannot disagree
 * about which day a horizon falls on.
 */
export const addCalendarMonths = (from: Date, months: number): Date => {
    const absoluteMonth = from.getMonth() + months;
    const year = from.getFullYear() + Math.floor(absoluteMonth / 12);
    const month = ((absoluteMonth % 12) + 12) % 12;

    // Day 0 of the following month is the last day of this one.
    const daysInTargetMonth = new Date(year, month + 1, 0).getDate();

    const result = new Date(from);
    // Set all three together: assigning the month alone would overflow before
    // the day could be corrected.
    result.setFullYear(year, month, Math.min(from.getDate(), daysInTargetMonth));
    return result;
};

const endOfLocalDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
};

const startOfLocalDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};

/**
 * The latest first session onboarding will accept.
 *
 * The whole of the final local day counts, so someone choosing that date is
 * not then refused for picking an evening appointment on it.
 */
export const latestFirstSessionAt = (now: Date = new Date()): Date =>
    endOfLocalDay(addCalendarMonths(now, SERIES_MONTHS_AHEAD));

/** Whether a chosen first session is close enough to be projected and shown. */
export const isWithinFirstSessionWindow = (
    candidate: Date,
    now: Date = new Date(),
): boolean => candidate.getTime() <= latestFirstSessionAt(now).getTime();

/**
 * The window of sessions the app fetches and edits: from the start of the
 * user's local day one year ahead. The floor is local midnight, not UTC
 * midnight: with a UTC floor, a session earlier today disappeared from the
 * calendar every evening for anyone west of UTC (and every morning east of
 * it), and anything that falls out of this window is also excluded from the
 * sync's deletion scope, so it silently became undeletable dead weight.
 * The same window is passed to syncSessions so the backend only deletes
 * within what the user could actually see.
 */
export const getSessionsWindow = (now: Date = new Date()) => {
    const to = new Date(now);
    to.setFullYear(to.getFullYear() + CALENDAR_YEARS_AHEAD);

    return { from: startOfLocalDay(now), to: endOfLocalDay(to) };
};

export const isWithinSessionsWindow = (
    candidate: Date,
    window = getSessionsWindow(),
): boolean => {
    const time = candidate.getTime();
    return Number.isFinite(time) && time >= window.from.getTime() && time <= window.to.getTime();
};
