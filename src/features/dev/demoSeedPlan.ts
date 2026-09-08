// What the demo seed intends to write, worked out with no IO.
//
// Split from demoSeed.ts so the decisions that are easy to get quietly wrong -
// which gap a note belongs to, which reminders it can have answered - can be
// tested without a device. The seeder itself is then only encryption and two
// inserts.
//
// The rule that matters: a note belongs to the gap between two sessions, and
// `noteReviewProgress` matches a review to a reminder on `localDate` and
// `gapIndex`. So every date here is taken from an occurrence the real scheduler
// produced, never invented, or the progress bar renders empty.
import type { TherapySession } from '../../api/therapy';
import type { Reason } from '../reminders/types';
import { sessionScheduleInputs } from '../reminders/reminderScheduleConfig';
import { occurrenceWindows } from '../reviews/reviewAttribution';
import { occurrencesForGap } from '../reviews/reviewSchedule';

/**
 * Sarah is in weekly therapy for anxiety, Mondays at 18:00. One note per
 * session she has already had, written the same evening.
 *
 * One subject each, in the first person, the way the example note on the empty
 * state models it. Oldest first, so the list reads as a course of therapy
 * rather than a pile.
 */
export const NOTES: readonly string[] = [
    'Told her about the Sunday night thing, how I start rehearsing Monday before I have even had dinner. She asked what I think would happen if I did not rehearse, and I could not actually answer.',
    'We stayed on the chest tightness for most of the hour. She kept asking where I notice it first, and it turns out my jaw goes before anything else does.',
    'I said I was fine three times before I admitted I had not slept. She did not push, she just waited, and the waiting was harder than being asked.',
    'She gave it a name, anticipatory anxiety, which I did not have a word for before. The fear of the meeting is doing more to me than any meeting actually has.',
    'Talked about checking my email at 6am to find out whether anything bad happened overnight. She asked how often something bad actually had. Twice, in a year.',
    'We rated the worry out of ten before and after I said it out loud. Eight down to four just from saying it, which I found annoying more than anything.',
    'I admitted I cancel plans when the anxiety is bad and then feel worse for having cancelled. She called it a loop that pays you straight away and charges you later.',
    'She asked what I would say to a friend who described my week back to me. I said I would tell them it sounds exhausting. I have never once said that to myself.',
    'First time I have talked about the panic attack on the train without my voice going. She pointed it out at the end and I had not noticed it myself.',
    'We went back to my mum asking whether I am eating properly. I got defensive in the room, and the defensiveness is probably the thing worth looking at.',
    'I mentioned I have been sleeping better since I stopped checking the clock at night. She asked what else changed that week and I could not name a single thing.',
];

/**
 * How many minutes after a session starts its note was written.
 *
 * Sessions run 50 minutes, so 75 puts the note about 25 minutes after Sarah got
 * home. It has to land after the session ends and before the next one begins,
 * which is what places the note in that session's gap.
 */
export const NOTE_OFFSET_MIN = 75;

/** How long after a reminder fired Sarah answered it. Inside every grace window. */
export const REVIEW_OFFSET_MIN = 34;

/**
 * How many of a note's already-fired reminders were answered.
 *
 * Counted back from the newest note, so the pattern holds however many notes
 * there are. A demo where every bar is full reads as fake and shows only one of
 * the four states a segment can take, so the recent gaps are left deliberately
 * unfinished: the newest note keeps an unanswered reminder to tick on camera,
 * and two older ones carry a missed segment.
 */
export function answeredCount(indexFromNewest: number, firedCount: number): number {
    if (indexFromNewest === 0) return Math.min(1, firedCount);
    if (indexFromNewest === 1) return Math.min(2, firedCount);
    if (indexFromNewest === 3 || indexFromNewest === 5) return Math.max(0, firedCount - 1);
    return firedCount;
}

export interface PlannedReview {
    localDate: string;
    reason: Reason;
    occurrenceAtUtc: string;
    gapIndex: number;
    reviewedAt: number;
}

export interface PlannedNote {
    gapIndex: number;
    text: string;
    createdAt: number;
    reviews: PlannedReview[];
}

/**
 * The notes and review ticks to write for `scheduleSessions`.
 *
 * Pass `scheduleSessions` rather than `sessions`: the latter is floored at
 * local midnight today and would drop every session that opened a past gap,
 * leaving the notes with nothing to attach to.
 *
 * Returns an empty plan when there are fewer than two sessions, since a gap
 * needs a session on both sides.
 */
export function planDemoSeed(
    scheduleSessions: TherapySession[],
    timeZone: string,
    now: Date = new Date(),
): PlannedNote[] {
    const { sessionsUtc, sessionDurationsMin } = sessionScheduleInputs(scheduleSessions);
    const starts = sessionsUtc
        .map((iso) => new Date(iso).getTime())
        .filter((ms) => Number.isFinite(ms))
        .sort((a, b) => a - b);

    if (starts.length < 2) return [];

    const scheduleInput = { sessionsUtc, sessionDurationsMin, timeZone };
    const nowMs = now.getTime();

    // Gaps whose note has already been written. A gap opening in the future
    // has not had its session yet, so there is nothing to write about.
    const openGaps: number[] = [];
    for (let gapIndex = 0; gapIndex < starts.length - 1; gapIndex += 1) {
        if (starts[gapIndex] + NOTE_OFFSET_MIN * 60_000 <= nowMs) openGaps.push(gapIndex);
    }

    // More gaps than notes is the normal case; take the most recent ones so the
    // list ends at the session Sarah has just had.
    const used = openGaps.slice(-NOTES.length);
    const texts = NOTES.slice(NOTES.length - used.length);

    return used.map((gapIndex, position) => {
        // Only reminders that have already fired can have been answered.
        const fired = occurrenceWindows(occurrencesForGap(gapIndex, scheduleInput))
            .filter((window) => window.atMs <= nowMs);

        const target = answeredCount(used.length - 1 - position, fired.length);

        return {
            gapIndex,
            text: texts[position],
            createdAt: starts[gapIndex] + NOTE_OFFSET_MIN * 60_000,
            reviews: fired.slice(0, target).map((window) => ({
                localDate: window.occurrence.localDate,
                reason: window.occurrence.reason,
                occurrenceAtUtc: window.occurrence.atUtc,
                gapIndex: window.occurrence.gapIndex,
                reviewedAt: Math.min(window.atMs + REVIEW_OFFSET_MIN * 60_000, nowMs),
            })),
        };
    });
}
