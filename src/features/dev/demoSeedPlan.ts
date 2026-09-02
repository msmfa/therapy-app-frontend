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
 * Written as a real write-up of a 50 minute session rather than a one line
 * summary: what was actually discussed, what she said back, and whatever Sarah
 * was left holding. First person, one main thread each, the voice the example
 * note on the empty state models. Oldest first, so the list reads as a course
 * of therapy rather than a pile.
 */
export const NOTES: readonly string[] = [
    'We spent most of the hour on the Sunday night thing. I told her I start rehearsing Monday somewhere around six on Sunday evening, before I have even had dinner, and that by the time I go to bed I have run the same three conversations maybe forty times. She asked what I thought would happen if I did not rehearse and I genuinely could not answer. I said something about being caught out, but when she pushed on what being caught out would actually look like I ran out of road. She did not fill the silence, which annoyed me at the time and seems useful now. We agreed I would write down the specific thing I am predicting on a Sunday, then check on the Monday evening whether it happened. She said the point is not to stop the worrying, it is to find out whether the worrying is any good at its job.',
    'Most of today was about where the anxiety actually sits in my body. I always describe it as chest tightness because that is the bit I notice when it is already bad, but she slowed me right down and asked what comes before that. We went through a normal Tuesday morning minute by minute and it turns out my jaw goes first, then my shoulders, and the chest is maybe the fourth thing rather than the first. I have been treating the last symptom as the first sign for years. She said that is why it always feels like it arrives out of nowhere, because I am not looking at the part that arrives early. Homework is to check my jaw three times a day whether or not I feel anxious, so I get a baseline rather than only noticing when it is already loud.',
    'Difficult one. I said I was fine three separate times before I admitted I have not slept properly since the middle of last week. She did not challenge it, she just left the pause open, and the pause was much harder to sit in than a question would have been. When I finally said it out loud I also said that telling people is worse than the tiredness, which I had not planned to say. We talked about where that comes from and I ended up describing being ill as a kid and the whole house rearranging itself around it. She suggested the fine reflex is doing a job it was hired for a long time ago and has never been let go. I do not have anything to do this week except notice when the word comes out automatically.',
    'She gave it a name today, anticipatory anxiety, and having a name for it took some of the heat out of it. I described the Thursday presentation and how I lost most of Wednesday to it, and she pointed out that the presentation itself lasted eleven minutes and went fine. Her line was that the fear of the meeting has cost me far more than any meeting ever has, and I have been paying that bill without ever looking at it. We drew it out on paper: the anticipation, the event, the relief, and how the relief never gets counted as evidence because by then I have moved on to the next thing. I am going to write down the prediction and the outcome for anything I catch myself dreading this week.',
    'Told her about checking my email at six in the morning to find out whether anything bad happened overnight. She asked how often something bad actually had, and I sat there and tried to count, and the honest answer is twice in about a year. Both times it could have waited until nine. She did not make a big thing of it, she just asked what the checking is for, and I said certainty. Then she asked whether I ever get it, and obviously I do not, because there is always another inbox tomorrow. We talked about how the checking gives me about ninety seconds of relief and then resets the clock. She was careful to say we are not banning it. The experiment is to move it to seven thirty for a week and write down what happens in the gap.',
    'Practical session. She had me rate the worry out of ten before saying it aloud and then again straight after. Eight before, four after, and I found that genuinely annoying because it suggests the thing I avoid most is the thing that helps most. We did it three times with different worries and it dropped every time, though not always by that much. She explained it as the difference between a worry circling in your head with no edges and a worry that has been said in a sentence and therefore has a beginning and an end. I said it feels like admitting weakness and she asked who I imagined was scoring me. I did not have an answer for that either. Doing the ratings at home this week, written down, even when there is no one to say them to.',
    'I admitted I have been cancelling things. Two dinners and my sister on Saturday, all with real sounding reasons, all because the anxiety was bad that morning. What I had not said before is how much worse I feel about an hour after cancelling, once the relief has burned off. She called it a loop that pays you straight away and charges you later, and that is exactly what it is. We looked at whether the anxiety was actually lower on the evenings I cancelled and I could not claim that it was. It just moved. She was clear that she is not asking me to force myself to everything. The idea is to pick one thing I would normally drop and go for the first half hour with permission to leave, so that leaving is a choice rather than the whole thing being avoided.',
    'She asked what I would say to a friend who described my week back to me exactly as I had just described it. I said I would tell them it sounds exhausting and that they are doing more than they think. Then she asked when I had last said anything like that to myself and the honest answer is never. Not once. The gap between the two voices was uncomfortable to look at. We spent the rest of the hour on where the harsh one came from, and a lot of it sounds like my dad, though I do not think he ever said any of it in those words. She was careful not to turn it into blame. Her point was that the voice is a habit rather than a verdict, and habits can be interrupted. I am to write down the friend version once a day.',
    'First time I have talked the whole way through the panic attack on the train without my voice going. She pointed it out right at the end and I had not noticed it myself, which I think is the actual news from today. I got through the part about the doors, the part about not being able to get a proper breath, and the bit afterwards on the platform that I have never told anyone. She said that being able to tell it as a story rather than reliving it is a sign that it has moved from the present to the past. That landed. I have avoided the Northern line for months on the basis that it would happen again, and today was the first time it occurred to me that avoiding it is what keeps the prediction untested.',
    'We went back to my mum and the eating question. She asks whether I am eating properly every single time she calls and I get defensive within about four words, which I know is out of proportion. In the room today I got defensive with my therapist just describing it, which we both noticed at the same time and which was more useful than anything I had planned to say. She asked what the question means to me and I said it means she thinks I cannot look after myself. Whether that is what my mum means is a different matter and I have never once asked. We are not doing anything dramatic. I am going to notice the flare when it happens on the phone and see whether I can leave a beat before I answer.',
    'I mentioned almost in passing that I have been sleeping better since I stopped checking the clock at night, and she stopped and stayed on it for twenty minutes. She wanted to know what else changed that week and I could not name a single thing, which she said is worth paying attention to, because I am very quick to find causes for the bad weeks and very slow to look for them in the good ones. We went back through it and there were things: I walked home twice, I did not work past seven on the Wednesday, I saw someone on the Friday. None of it registered as relevant at the time. Her point was that I keep a detailed record of the evidence against me and almost none of the evidence for. Homework is to write down one thing that went well each day, however small.',
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
