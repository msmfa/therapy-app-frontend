// Reconstructing the reminders a review can answer
// --------------------------------------------------
// `TherapySessionsContext` holds `neuroReminders`, but that array is filtered
// to the future (`scheduleNeuroplasticityReminders` drops anything at or before
// its `nowUtc`). It therefore never contains the occurrence a user is ticking,
// because that one has already fired. Reading the context value to ask "what
// was due earlier this week" returns an empty set every time.
//
// The scheduler is pure, so the fix is to call it again with `nowUtc` moved
// back to before the window of interest. That is safe rather than lucky: two
// occurrences only ever share a day when a 07:00 `post_sleep` meets a 20:00
// evening reminder, and every evening reason outranks `post_sleep` in
// REASON_PRIORITY, so the day's single slot goes to the evening one whichever
// side of `now` the pair happens to fall. Replaying the past reproduces the
// occurrences that really fired.
import {
    scheduleNeuroplasticityReminders,
    type Reminder,
} from '../reminders/reminder-schedule-v2';
import { REMINDER_SCHEDULE } from '../reminders/reminderScheduleConfig';
import { Reason } from '../reminders/types';
import { calendarDaysBetweenInZone, resolveTimeZone } from '../../utils/timeZone';

export interface ReviewScheduleInput {
    sessionsUtc: string[];
    /** Stable backend session ids, independent of edited appointment times. */
    sessionIdsByStart?: Record<string, string>;
    timeZone?: string;
    sessionDurationsMin?: Record<string, number>;
    reflectionMinutes?: number;
    morningMinutes?: number;
    reflectionHour?: number;
    morningHour?: number;
    startAfterDays?: number;
    cadenceDays?: number;
}

export type ReviewOccurrence = Reminder & { occurrenceId?: string };

interface OccurrenceIdentity {
    openingSessionId: string;
    closingSessionId: string;
}

function readOccurrenceIdentity(value: string | null | undefined): OccurrenceIdentity | null {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.length !== 5 || parsed[0] !== 'review-v1'
            || typeof parsed[1] !== 'string' || typeof parsed[2] !== 'string') return null;
        return { openingSessionId: parsed[1], closingSessionId: parsed[2] };
    } catch {
        return null;
    }
}

const sortedSessionIsos = (input: ReviewScheduleInput): string[] =>
    input.sessionsUtc.filter((iso) => Number.isFinite(Date.parse(iso)))
        .sort((a, b) => Date.parse(a) - Date.parse(b));

/** Keep an already-reviewed note attached to its original sessions after edits. */
export function gapIndexForReview(
    createdAt: number,
    input: ReviewScheduleInput,
    reviews: Array<{ occurrenceId?: string | null }>,
): number | null {
    const starts = sortedSessionIsos(input);
    const identifiedGaps = new Set<number>();
    for (const review of reviews) {
        const identity = readOccurrenceIdentity(review.occurrenceId);
        if (!identity) continue;
        const index = starts.findIndex((start, position) =>
            input.sessionIdsByStart?.[start] === identity.openingSessionId
            && input.sessionIdsByStart?.[starts[position + 1]] === identity.closingSessionId);
        if (index >= 0 && index < starts.length - 1) identifiedGaps.add(index);
    }
    // Conflicting historical identities are ambiguous; do not arbitrarily
    // pick a different gap for the note.
    if (identifiedGaps.size === 1) return identifiedGaps.values().next().value!;
    return gapIndexForTimestamp(createdAt, input.sessionsUtc);
}

export function reviewGapBounds(gapIndex: number, input: ReviewScheduleInput): [number, number] | null {
    const starts = sortedStarts(input.sessionsUtc);
    return gapIndex >= 0 && gapIndex < starts.length - 1 ? [starts[gapIndex], starts[gapIndex + 1]] : null;
}

const runSchedule = (nowUtc: string, input: ReviewScheduleInput): Reminder[] =>
    scheduleNeuroplasticityReminders({
        nowUtc,
        sessionsUtc: input.sessionsUtc,
        reflectionMinutes: input.reflectionMinutes,
        morningMinutes: input.morningMinutes,
        reflectionHour: input.reflectionHour ?? REMINDER_SCHEDULE.reflectionHour,
        morningHour: input.morningHour ?? REMINDER_SCHEDULE.morningHour,
        startAfterDays: input.startAfterDays ?? REMINDER_SCHEDULE.startAfterDays,
        cadenceDays: input.cadenceDays ?? REMINDER_SCHEDULE.cadenceDays,
        timeZone: input.timeZone,
        sessionDurationsMin: input.sessionDurationsMin,
    });

const sortedStarts = (sessionsUtc: string[]): number[] =>
    sessionsUtc
        .map((iso) => new Date(iso).getTime())
        .filter((ms) => Number.isFinite(ms))
        .sort((a, b) => a - b);

/**
 * Which gap a note belongs to: one note per gap, so this is the note's identity
 * against the schedule.
 *
 * Gap `i` runs from session `i` up to session `i + 1`. A note written before
 * the first session, or after the most recent one, has no gap yet - there is no
 * schedule for it either, since the scheduler needs both ends.
 */
export function gapIndexForTimestamp(
    atMs: number,
    sessionsUtc: string[],
): number | null {
    if (!Number.isFinite(atMs)) return null;

    const starts = sortedStarts(sessionsUtc);
    if (starts.length < 2) return null;

    for (let index = 0; index < starts.length - 1; index += 1) {
        if (atMs >= starts[index] && atMs < starts[index + 1]) return index;
    }

    return null;
}

/**
 * Every occurrence belonging to one gap, fired ones included.
 *
 * Replays from the gap's own start, which is the earliest instant any of its
 * reminders can occupy.
 */
export function occurrencesForGap(
    gapIndex: number,
    input: ReviewScheduleInput,
): ReviewOccurrence[] {
    const starts = sortedStarts(input.sessionsUtc);
    if (gapIndex < 0 || gapIndex >= starts.length - 1) return [];

    const sessionIsos = sortedSessionIsos(input);
    const openingId = input.sessionIdsByStart?.[sessionIsos[gapIndex]];
    const closingId = input.sessionIdsByStart?.[sessionIsos[gapIndex + 1]];
    return runSchedule(new Date(starts[gapIndex]).toISOString(), input).filter(
        (reminder) => reminder.gapIndex === gapIndex,
    ).map((reminder) => {
        if (!openingId || !closingId) return reminder;
        // Mid-session reminders repeat. Use their original cadence day, not
        // their index after daily deduplication removes other candidates.
        const slot = reminder.reason === Reason.MidSession
            ? calendarDaysBetweenInZone(new Date(starts[gapIndex]), new Date(reminder.atUtc), resolveTimeZone(input.timeZone))
            : 0;
        return {
            ...reminder,
            occurrenceId: JSON.stringify(['review-v1', openingId, closingId, reminder.reason, slot]),
        };
    });
}
