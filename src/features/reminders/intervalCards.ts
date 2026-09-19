import type { PlanTimelineEntry } from '../onboarding/planTimeline';
import type { Reminder } from './types';
import { Reason } from './types';
import { formattingLocale } from '../../i18n';
import { t } from '../../i18n/translate';

export type IntervalCard = {
    reason: Reason;
    /** The exact time shown in the dot-matrix panel. */
    time: string;
    /** The date and optional occurrence count below the time. */
    caption: string;
};

const PLAN_REASON: Partial<Record<PlanTimelineEntry['id'], Reason>> = {
    post_session: Reason.PostSession,
    post_sleep: Reason.PostSleep,
    mid_session: Reason.MidSession,
    pre_session: Reason.PreSession,
};

const safeFormat = (
    date: Date,
    options: Intl.DateTimeFormatOptions,
    locale?: string,
): string => {
    try {
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
        return date.toISOString();
    }
};

const timeAt = (date: Date, timeZone?: string, locale?: string): string =>
    safeFormat(
        date,
        {
            hour: 'numeric',
            minute: '2-digit',
            ...(timeZone === undefined ? {} : { timeZone }),
        },
        locale,
    );

const dateAt = (date: Date, timeZone?: string, locale?: string): string =>
    safeFormat(
        date,
        {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            ...(timeZone === undefined ? {} : { timeZone }),
        },
        locale,
    );

/**
 * The zone still decides what the clock reads; it is no longer written out.
 *
 * The caption used to carry the zone's short name, so a card read "Wed, 16 Sep
 * · GMT · next of 3". The times are already shown in the user's own zone, which
 * is the only zone they are in, so naming it added a word that could only ever
 * say what the reader already assumed. `timeZone` stays a parameter because
 * `dateAt` and `timeAt` still resolve the instant in it.
 */
const captionAt = (
    date: Date,
    count: number,
    timeZone?: string,
    locale?: string,
): string => {
    const parts = [dateAt(date, timeZone, locale)];
    if (count > 1) parts.push(t('science:intervals.nextOf', { count }));
    return parts.join(' · ');
};

/**
 * Exact review moments from the unsaved plan currently being previewed.
 *
 * `locale` defaults to the app's rather than staying optional. It was
 * optional, both callers omitted it, and `undefined` sends Intl to the
 * platform's default locale, which on Hermes is "en-GB" whatever language the
 * app is in. The captions therefore read "Wed, 16 Sep" inside a French card.
 * Defaulting here rather than at the call sites means a new caller cannot
 * reintroduce it.
 */
export const intervalCardsFromPlan = (
    entries: PlanTimelineEntry[],
    locale: string = formattingLocale(),
): IntervalCard[] =>
    entries.flatMap((entry) => {
        const reason = PLAN_REASON[entry.id];
        if (reason === undefined) return [];

        return [{
            reason,
            time: timeAt(entry.at, undefined, locale),
            caption: captionAt(entry.at, entry.occurrences.length, undefined, locale),
        }];
    });

/**
 * The next real occurrence of every review type in the server-owned schedule.
 *
 * The server response is the same answer the push sender uses. Grouping it here
 * avoids showing several identical science cards while still making the next
 * date, exact time and number of remaining occurrences explicit.
 */
export const intervalCardsFromSchedule = (
    reminders: Reminder[],
    timeZone: string,
    locale: string = formattingLocale(),
): IntervalCard[] => {
    const grouped = new Map<Reason, Date[]>();

    [...reminders]
        .map((reminder) => ({ reminder, at: new Date(reminder.atUtc) }))
        .filter(({ at }) => !Number.isNaN(at.getTime()))
        .sort((first, second) => first.at.getTime() - second.at.getTime())
        .forEach(({ reminder, at }) => {
            const dates = grouped.get(reminder.reason) ?? [];
            dates.push(at);
            grouped.set(reminder.reason, dates);
        });

    return [...grouped.entries()].map(([reason, dates]) => ({
        reason,
        time: timeAt(dates[0], timeZone, locale),
        caption: captionAt(dates[0], dates.length, timeZone, locale),
    }));
};
