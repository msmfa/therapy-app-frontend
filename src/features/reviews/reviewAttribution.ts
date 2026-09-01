// Deciding which reminder a tick belongs to
// --------------------------------------------------
// A reminder fires, and some time later the user opens the note and marks it
// reviewed. Those two moments are not always on the same calendar day: the
// evening reminder lands at 20:00, and someone who taps at 00:20 has already
// rolled into tomorrow. Attributing by "today's date" would credit the wrong
// day and leave the evening looking missed.
//
// So a tick is attributed to a reminder *occurrence*, not to a date, and the
// occurrence supplies the day. The window a tick can reach back through is
// bounded by two things:
//
//  • the next scheduled occurrence - a tick can never reach past it and steal
//    the following reminder's slot. This is self-correcting: when the morning
//    review exists the evening tick stops at 07:00, and when it has been
//    dropped (a two-day gap gives its day to `pre_session`, which outranks
//    `post_sleep`) the evening tick is free to roll further with nothing to
//    collide with.
//  • an absolute cap per reason, below. `mid_session` reminders sit four days
//    apart, and a tick three days late is a new act of review rather than a
//    late answer to the old one.
//
// Anything outside both is still a real review, just an unprompted one: it is
// recorded against its own day with no reason attached.
import { Reason, type Reminder } from '../reminders/types';
import { localDateKeyInZone, resolveTimeZone } from '../../utils/timeZone';

/**
 * How long after firing an occurrence still accepts a tick, in hours.
 *
 * `post_session` is the short one by design. It fires at `reflectionHour`
 * (20:00) and the copy in neuroReminders.ts sells it on early consolidation -
 * "this evening", "the first six hours". Eight hours carries it to 04:00, far
 * enough to catch someone reviewing before bed just after midnight, and short
 * enough that it never reaches the 07:00 morning reminder.
 */
export const GRACE_HOURS: Readonly<Record<Reason, number>> = {
    [Reason.PostSession]: 8,
    [Reason.PostSleep]: 15,
    [Reason.MidSession]: 24,
    [Reason.PreSession]: 12,
};

const HOUR_MS = 60 * 60 * 1000;

export interface ReviewAttribution {
    /** The day this review counts for, `YYYY-MM-DD` in the user's zone. */
    localDate: string;
    /** Which reminder it answers, or null when the review was unprompted. */
    reason: Reason | null;
    /** The occurrence's instant, kept so a rollup can match without re-deriving. */
    occurrenceAtUtc: string | null;
    gapIndex: number | null;
}

export interface AttributeReviewParams {
    /**
     * Occurrences the tick could plausibly answer. Callers pass the schedule
     * for the note's own gap; occurrences from other gaps are harmless but
     * pointless, since a later gap's reminders are all in the future.
     */
    occurrences: Reminder[];
    /** When the user actually ticked. */
    at: Date;
    timeZone?: string;
    graceHours?: Partial<Record<Reason, number>>;
}

const graceMsFor = (
    reason: Reason,
    overrides: Partial<Record<Reason, number>> | undefined,
): number => (overrides?.[reason] ?? GRACE_HOURS[reason]) * HOUR_MS;

export interface OccurrenceWindow {
    occurrence: Reminder;
    /** When it fires. */
    atMs: number;
    /** When it stops accepting a tick: the next occurrence, or its own cap. */
    closesAtMs: number;
}

/**
 * The occurrences in order, each with the instant it stops being answerable.
 *
 * Attribution and progress both need this boundary and must not disagree about
 * it, or a reminder could read as missed on the card while a tick would still
 * be credited to it.
 */
export function occurrenceWindows(
    occurrences: Reminder[],
    graceHours?: Partial<Record<Reason, number>>,
): OccurrenceWindow[] {
    const sorted = occurrences
        .map((occurrence) => ({ occurrence, atMs: new Date(occurrence.atUtc).getTime() }))
        .filter((entry) => Number.isFinite(entry.atMs))
        .sort((a, b) => a.atMs - b.atMs);

    return sorted.map((entry, index) => {
        const cap = entry.atMs + graceMsFor(entry.occurrence.reason, graceHours);
        const next = sorted[index + 1];
        return {
            ...entry,
            closesAtMs: next ? Math.min(next.atMs, cap) : cap,
        };
    });
}

/**
 * Attributes one tick to the occurrence it answers, falling back to an
 * unprompted review keyed on the tick's own local day.
 */
export function attributeReview({
    occurrences,
    at,
    timeZone,
    graceHours,
}: AttributeReviewParams): ReviewAttribution {
    const zone = resolveTimeZone(timeZone);
    const spontaneous: ReviewAttribution = {
        localDate: localDateKeyInZone(at, zone),
        reason: null,
        occurrenceAtUtc: null,
        gapIndex: null,
    };

    const tickMs = at.getTime();
    if (!Number.isFinite(tickMs)) return spontaneous;

    const windows = occurrenceWindows(occurrences, graceHours);
    const open = windows.find(
        (window) => window.atMs <= tickMs && tickMs < window.closesAtMs,
    );

    if (!open) return spontaneous;

    return {
        localDate: open.occurrence.localDate,
        reason: open.occurrence.reason,
        occurrenceAtUtc: open.occurrence.atUtc,
        gapIndex: open.occurrence.gapIndex,
    };
}
