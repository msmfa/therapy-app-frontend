/**
 * The reminder vocabulary, shared by the API client and the copy that explains
 * each reminder to the user.
 *
 * The schedule itself is not computed here. The server materialises it into
 * the rows its cron sends from, and `GET /api/calendar` returns those rows;
 * this is the older, id-less shape the science screen and the reviews
 * feature still read, mapped from them.
 *
 * Keeping a second scheduler in the app was what let the calendar and the
 * notifications disagree: the two implementations matched, but they were fed
 * different sessions, so they reached different answers. A shared algorithm
 * would not have prevented that. A single answer does.
 */
export enum Reason {
    PostSession = 'post_session',
    PostSleep = 'post_sleep',
    MidSession = 'mid_session',
    PreSession = 'pre_session',
}

export interface Reminder {
    atUtc: string;
    reason: Reason;
    gapIndex: number;
    /**
     * The calendar day this reminder belongs to in the user's zone, as
     * YYYY-MM-DD. 20:00 in Los Angeles is 04:00 UTC the next day, so deriving a
     * day key from `atUtc` puts calendar markers on the wrong date; consumers
     * should key off this instead.
     */
    localDate: string;
}
