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

export interface ReviewScheduleInput {
    sessionsUtc: string[];
    timeZone?: string;
    sessionDurationsMin?: Record<string, number>;
    reflectionHour?: number;
    morningHour?: number;
    startAfterDays?: number;
    cadenceDays?: number;
}

const runSchedule = (nowUtc: string, input: ReviewScheduleInput): Reminder[] =>
    scheduleNeuroplasticityReminders({
        nowUtc,
        sessionsUtc: input.sessionsUtc,
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
): Reminder[] {
    const starts = sortedStarts(input.sessionsUtc);
    if (gapIndex < 0 || gapIndex >= starts.length - 1) return [];

    return runSchedule(new Date(starts[gapIndex]).toISOString(), input).filter(
        (reminder) => reminder.gapIndex === gapIndex,
    );
}
