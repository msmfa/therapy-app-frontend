// What actually breaks about the demo seed is placement, not content: a note
// written a minute outside its gap still appears in the list, but it attaches
// to no schedule and draws an empty progress bar, which is exactly the thing
// the screenshots exist to show. These lock the placement down against the
// real scheduler.
import { answeredCount, NOTE_OFFSET_MIN, planDemoSeed } from '../demoSeedPlan';
import { sessionScheduleInputs } from '../../reminders/reminderScheduleConfig';
import { occurrenceWindows } from '../../reviews/reviewAttribution';
import { gapIndexForTimestamp, occurrencesForGap } from '../../reviews/reviewSchedule';
import type { TherapySession } from '../../../api/therapy';

const TIME_ZONE = 'Europe/London';
const NOTE_OFFSET_MS = NOTE_OFFSET_MIN * 60_000;

/**
 * The sessions seed-demo-sarah.ts writes: Mondays at 18:00 Europe/London,
 * 10 weeks back and 6 forward. Spelled as UTC instants at 17:00 because the
 * whole range here sits in BST, which is what the backend script resolves to.
 */
const sessions: TherapySession[] = Array.from({ length: 17 }, (_, index) => {
    const day = 22 + index * 7; // 2026-06-22 is a Monday.
    const start = new Date(Date.UTC(2026, 5, day, 17, 0));
    return {
        _id: `session-${index}`,
        startsAtUtc: start.toISOString(),
        durationMin: 50,
    };
});

const NOW = new Date('2026-09-02T12:00:00.000Z');

const scheduleInput = { ...sessionScheduleInputs(sessions), timeZone: TIME_ZONE };

const starts = sessions
    .map((session) => new Date(session.startsAtUtc).getTime())
    .sort((a, b) => a - b);

/** Gaps whose note has already been written, matching seedDemoData. */
const openGaps = starts
    .slice(0, -1)
    .map((start, gapIndex) => ({ gapIndex, noteAtMs: start + NOTE_OFFSET_MS }))
    .filter((gap) => gap.noteAtMs <= NOW.getTime());

describe('demo seed placement', () => {
    it('leaves a gap for every session that has already happened', () => {
        expect(openGaps).toHaveLength(11);
    });

    it('places every seeded note inside the gap it was written for', () => {
        for (const { gapIndex, noteAtMs } of openGaps) {
            expect(gapIndexForTimestamp(noteAtMs, scheduleInput.sessionsUtc)).toBe(gapIndex);
        }
    });

    it('gives every seeded note a non-empty reminder schedule', () => {
        for (const { gapIndex } of openGaps) {
            expect(occurrencesForGap(gapIndex, scheduleInput).length).toBeGreaterThan(0);
        }
    });

    it('writes each note after its session has ended', () => {
        for (const { gapIndex, noteAtMs } of openGaps) {
            expect(noteAtMs).toBeGreaterThan(starts[gapIndex] + 50 * 60_000);
        }
    });

    it('leaves the newest note with an unanswered reminder to tick on camera', () => {
        const newest = openGaps[openGaps.length - 1];
        const fired = occurrenceWindows(occurrencesForGap(newest.gapIndex, scheduleInput))
            .filter((window) => window.atMs <= NOW.getTime());

        expect(fired.length).toBeGreaterThan(answeredCount(0, fired.length));
    });

    it('answers every fired reminder on the older notes, and holds one back on two of them', () => {
        const fired = 4;

        expect(answeredCount(2, fired)).toBe(fired);
        expect(answeredCount(3, fired)).toBe(fired - 1);
        expect(answeredCount(5, fired)).toBe(fired - 1);
    });

    it('never claims more answers than there were reminders', () => {
        for (let indexFromNewest = 0; indexFromNewest < 11; indexFromNewest += 1) {
            for (let fired = 0; fired <= 5; fired += 1) {
                const answered = answeredCount(indexFromNewest, fired);
                expect(answered).toBeGreaterThanOrEqual(0);
                expect(answered).toBeLessThanOrEqual(fired);
            }
        }
    });
});

describe('planDemoSeed', () => {
    const plan = planDemoSeed(sessions, TIME_ZONE, NOW);

    it('writes one note per session already had, capped at the notes available', () => {
        expect(plan).toHaveLength(11);
    });

    it('orders the notes oldest first, one per gap, with no gap used twice', () => {
        const gaps = plan.map((note) => note.gapIndex);

        expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
        expect(new Set(gaps).size).toBe(gaps.length);
    });

    it('gives every note text and a review history', () => {
        for (const note of plan) {
            expect(note.text.length).toBeGreaterThan(0);
        }

        // The newest note is deliberately near-empty, so check the body of the
        // list rather than every entry.
        const reviewed = plan.filter((note) => note.reviews.length > 0);
        expect(reviewed.length).toBeGreaterThanOrEqual(plan.length - 1);
    });

    it('attributes every review to the gap its note belongs to', () => {
        for (const note of plan) {
            for (const review of note.reviews) {
                expect(review.gapIndex).toBe(note.gapIndex);
            }
        }
    });

    it('never records a review before its reminder fired or in the future', () => {
        for (const note of plan) {
            for (const review of note.reviews) {
                expect(review.reviewedAt).toBeGreaterThanOrEqual(
                    new Date(review.occurrenceAtUtc).getTime(),
                );
                expect(review.reviewedAt).toBeLessThanOrEqual(NOW.getTime());
            }
        }
    });

    it('records at most one review per note per day, which the unique index enforces', () => {
        for (const note of plan) {
            const days = note.reviews.map((review) => review.localDate);
            expect(new Set(days).size).toBe(days.length);
        }
    });

    it('returns nothing when there are not two sessions to form a gap', () => {
        expect(planDemoSeed([], TIME_ZONE, NOW)).toEqual([]);
        expect(planDemoSeed(sessions.slice(0, 1), TIME_ZONE, NOW)).toEqual([]);
    });
});
