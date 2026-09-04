import { describe, expect, it } from '@jest/globals';
import { Reason } from '../../reminders/types';
import { gapIndexForTimestamp, occurrencesForGap } from '../reviewSchedule';
import { noteReviewProgress, summariseReviewsByNote } from '../reviewProgress';
import type { NoteReview } from '../reviewStore';

// A seven-day gap. Its four reminders land on the 1st (20:00), 2nd (07:00),
// 4th (20:00) and 7th (20:00).
const SESSIONS = ['2024-01-01T14:00:00.000Z', '2024-01-08T14:00:00.000Z'];
const CREATED_AT = Date.parse('2024-01-01T15:00:00.000Z');

const review = (localDate: string, gapIndex: number | null = 0): NoteReview => ({
    noteId: 'note-1',
    localDate,
    reviewedAt: Date.parse(`${localDate}T21:00:00.000Z`),
    gapIndex,
    reason: Reason.PostSession,
    occurrenceAtUtc: null,
});

const progress = (reviews: NoteReview[], now: string, createdAt = CREATED_AT) =>
    noteReviewProgress({
        sessionsUtc: SESSIONS,
        timeZone: 'UTC',
        createdAt,
        noteId: 'note-1',
        reviews,
        now: new Date(now),
    });

describe('noteReviewProgress', () => {
    it('uses the gap as the denominator', () => {
        const result = progress([], '2024-01-01T15:00:00.000Z');

        expect(result.gapIndex).toBe(0);
        expect(result.total).toBe(4);
        expect(result.segments.map((s) => s.occurrence.localDate)).toEqual([
            '2024-01-01',
            '2024-01-02',
            '2024-01-04',
            '2024-01-07',
        ]);
    });

    it('marks everything upcoming before the first reminder fires', () => {
        const result = progress([], '2024-01-01T15:00:00.000Z');

        expect(result.segments.every((s) => s.status === 'upcoming')).toBe(true);
        expect(result.ratio).toBe(0);
        expect(result.nextOccurrence?.reason).toBe(Reason.PostSession);
        expect(result.openOccurrence).toBeNull();
    });

    it('flags the reminder a tick would answer as open, not missed', () => {
        const result = progress([], '2024-01-01T21:00:00.000Z');

        expect(result.segments[0].status).toBe('open');
        expect(result.missed).toBe(0);
        expect(result.openOccurrence?.localDate).toBe('2024-01-01');
    });

    it('marks a reminder missed once its window has closed', () => {
        // post_session closes at the 07:00 morning reminder.
        const result = progress([], '2024-01-02T08:00:00.000Z');

        expect(result.segments[0].status).toBe('missed');
        expect(result.segments[1].status).toBe('open');
        expect(result.missed).toBe(1);
    });

    it('fills as reminders are answered', () => {
        const result = progress([review('2024-01-01'), review('2024-01-02')], '2024-01-04T10:00:00.000Z');

        expect(result.completed).toBe(2);
        expect(result.ratio).toBe(0.5);
        expect(result.segments.map((s) => s.status)).toEqual([
            'done',
            'done',
            'upcoming',
            'upcoming',
        ]);
        expect(result.isComplete).toBe(false);
    });

    it('completes when every reminder in the gap was answered', () => {
        const result = progress(
            [review('2024-01-01'), review('2024-01-02'), review('2024-01-04'), review('2024-01-07')],
            '2024-01-08T09:00:00.000Z',
        );

        expect(result.completed).toBe(4);
        expect(result.ratio).toBe(1);
        expect(result.isComplete).toBe(true);
        expect(result.missed).toBe(0);
    });

    it('lets an unprompted review answer whatever was due that day', () => {
        const result = progress([review('2024-01-02', null)], '2024-01-03T09:00:00.000Z');

        expect(result.segments[1].status).toBe('done');
    });

    it('ignores a review recorded against another gap', () => {
        const result = progress([review('2024-01-02', 1)], '2024-01-03T09:00:00.000Z');

        expect(result.completed).toBe(0);
    });

    it('ignores reviews belonging to another note', () => {
        const other: NoteReview = { ...review('2024-01-01'), noteId: 'note-2' };
        const result = progress([other], '2024-01-02T08:00:00.000Z');

        expect(result.completed).toBe(0);
    });

    it('reports no schedule for a note written outside any gap', () => {
        // After the most recent session there is no gap, so nothing is due and
        // the bar must not read as 0 of 4.
        const result = progress([], '2024-01-09T10:00:00.000Z', Date.parse('2024-01-09T09:00:00.000Z'));

        expect(result.hasSchedule).toBe(false);
        expect(result.total).toBe(0);
        expect(result.ratio).toBe(0);
        expect(result.isComplete).toBe(false);
        expect(gapIndexForTimestamp(Date.parse('2024-01-09T09:00:00.000Z'), SESSIONS)).toBeNull();
    });

    it('counts the same reminders the schedule produced', () => {
        const result = progress([], '2024-01-03T10:00:00.000Z');

        expect(result.total).toBe(
            occurrencesForGap(0, { sessionsUtc: SESSIONS, timeZone: 'UTC' }).length,
        );
    });

    it('replays review windows at the saved minute-level times', () => {
        const occurrences = occurrencesForGap(0, {
            sessionsUtc: SESSIONS,
            timeZone: 'UTC',
            morningMinutes: 7 * 60 + 30,
            reflectionMinutes: 20 * 60 + 15,
        });

        expect(occurrences.map((occurrence) => occurrence.atUtc)).toEqual([
            '2024-01-01T20:15:00.000Z',
            '2024-01-02T07:30:00.000Z',
            '2024-01-04T20:15:00.000Z',
            '2024-01-07T20:15:00.000Z',
        ]);
    });
});

describe('summariseReviewsByNote', () => {
    it('counts reviews per note, most recent day first', () => {
        const summaries = summariseReviewsByNote([
            review('2024-01-01'),
            review('2024-01-04'),
            { ...review('2024-01-02'), noteId: 'note-2' },
        ]);

        expect(summaries['note-1'].count).toBe(2);
        expect(summaries['note-1'].days).toEqual(['2024-01-04', '2024-01-01']);
        expect(summaries['note-1'].lastReviewedAt).toBe(Date.parse('2024-01-04T21:00:00.000Z'));
        expect(summaries['note-2'].count).toBe(1);
    });
});
