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
 * Sarah is in weekly analytic therapy, Mondays at 18:00. One note per session
 * she has already had, written the same evening.
 *
 * Oldest first, so the list reads as a course of therapy rather than a pile.
 * The dream in the house runs through the middle and comes back changed.
 *
 * Shaped like a real therapy journal rather than a caption. People write these
 * on a phone an hour after a session, so they run long, break into paragraphs,
 * quote the therapist, trail off, and carry the odd line of homework or a
 * question to bring back next time. Several answer the app's own five
 * questions without being asked to, which is what a note written against this
 * template actually looks like once the template stops being needed.
 *
 * Length is deliberate. The card clamps at four lines and NotePreviewModal
 * scrolls the rest, so a note that overflows its card is the normal case and
 * is what makes opening one worth doing. First lines carry the list, so no two
 * open the same way.
 *
 * Contractions throughout. The rest of the app's copy avoids them because the
 * app is speaking; here Sarah is, and a note without them reads as written by
 * a copywriter.
 */
export const NOTES: readonly string[] = [
    'First session where I actually said something. She asked who I am when nobody needs anything from me and I gave her my job title, and I heard myself do it.\nThen we just sat there for what felt like five minutes. I kept waiting for her to fill the gap and she didn’t.\nBring next time: why that was so hard.',
    'Had the house dream again. Same one, I’m in the flat I grew up in and there’s a whole floor at the top I didn’t know was there.\nTold her about it and she wouldn’t say what it means. She just asked what I do in the dream when I find it.\nI shut the door. Every time, apparently. Didn’t notice that until I said it out loud.',
    'Went on for ages about the bloke at work who talks over everyone in standup. She let me finish and then asked why I never do that.\nSaid it’s manners. She didn’t argue, she just left it sitting there, which was worse.\nTo try this week: notice when I’m about to say something and see what stops me.',
    'Talked about home. Being the one who sorted things out, making sure Mum was alright, keeping everything level, from about ten onwards.\nShe asked who gave me that job and I said nobody did, and then heard it.\nI’ve always thought of it as just my personality. Being the reliable one. She said a role you get handed that early doesn’t feel like a role, it feels like you.\nNot sure what to do with that yet.',
    'Short one, knackered.\nNoticed I tidy my week up before I tell her. Good bits in, boring and embarrassing bits left out. She caught it tonight and asked what I thought would happen if I brought the rest.\nI do this with everybody. She just gets an hour a week to spot it.',
    'The voice in my head that has a go at me sounds like somebody specific. Same words, same little pause before the worst part of the sentence.\nSaid that out loud for the first time tonight and felt disloyal, which is probably the point.\nShe asked how old I was when I first heard it. I’ve been having an argument with someone who stopped saying it about twenty years ago.',
    'Odd session. She asked me to talk to the man on the stairs from the dream. Not about him, to him, out loud, in the room.\nFelt completely daft for the first minute. Then it stopped being daft and I don’t really know how to write down what happened after that.\nAsked him what he wanted and the answer came straight back, that he’d been waiting. I wasn’t expecting an answer at all, never mind that fast.\nSat in the car for a bit before driving home.',
    'What stayed with me: she didn’t say I’d been unlucky.\nThird thing I’ve ended in the week it started to actually matter. I laid it all out expecting some sympathy and she just asked what I get out of leaving first.\nStill haven’t got an answer. Bringing this one back next time.',
    'Told her about the feeling I’ve had for years, that at some point somebody will turn up and take it all off my hands. Not rescue exactly. Just take over.\nShe asked how old that feeling is and I said about nine before I’d even thought about it.\nWorth writing down that I felt about nine while I was saying it.',
    'Dream was different this time.\nThe door on the top floor was open and I went in. Just an ordinary room. Bare, bit dusty, one window painted shut.\nWoke up genuinely disappointed, like I’d been promised something. Told her that and she reckoned the disappointment was the interesting bit, not the room.',
    'Late, writing this in bed.\nSaid I’m scared of turning into someone people wouldn’t recognise. She asked recognise you how, and who by. I couldn’t name anybody I still properly speak to.\nSat with that for the rest of the hour. Not sure it’s a bad thing yet.',
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
