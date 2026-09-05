// How far through its reviews one note is.
//
// The unit is the gap between two sessions, not a calendar week: one note per
// gap, and the gap's own reminders are the whole of what that note is ever
// asked for. So a note has a fixed denominator the moment its gap exists -
// typically four - and the card can draw a bar that fills as the reminders are
// answered.
import type { Reminder } from '../reminders/types';
import { occurrenceWindows } from './reviewAttribution';
import { gapIndexForTimestamp, occurrencesForGap, type ReviewScheduleInput } from './reviewSchedule';
import type { NoteReview } from './reviewStore';

export type ReviewSegmentStatus =
    /** Answered. */
    | 'done'
    /** Fired and still answerable: this is the one the tick would count for. */
    | 'open'
    /** Fired, its window closed, never answered. */
    | 'missed'
    /** Has not fired yet. */
    | 'upcoming';

export interface ReviewSegment {
    occurrence: Reminder;
    status: ReviewSegmentStatus;
}

export interface NoteReviewProgress {
    /** Null when the note sits outside any known gap, so nothing is scheduled. */
    gapIndex: number | null;
    /** One per reminder in the gap, in order - the bar's segments. */
    segments: ReviewSegment[];
    total: number;
    completed: number;
    missed: number;
    upcoming: number;
    /** `completed / total`, and 0 rather than NaN when nothing is scheduled. */
    ratio: number;
    /** The occurrence a tick would answer right now, if any. */
    openOccurrence: Reminder | null;
    nextOccurrence: Reminder | null;
    /**
     * False when the note has no reminders at all: written outside any gap, or
     * with no next session booked. The bar should say so rather than show 0/0,
     * which reads as failure.
     */
    hasSchedule: boolean;
    isComplete: boolean;
}

export interface NoteReviewProgressParams extends ReviewScheduleInput {
    /** The note's creation time, which places it in a gap. */
    createdAt: number;
    /** Reviews for this note. Rows for other notes are ignored if passed. */
    reviews: NoteReview[];
    noteId?: string;
    now?: Date;
}

const EMPTY: NoteReviewProgress = {
    gapIndex: null,
    segments: [],
    total: 0,
    completed: 0,
    missed: 0,
    upcoming: 0,
    ratio: 0,
    openOccurrence: null,
    nextOccurrence: null,
    hasSchedule: false,
    isComplete: false,
};

/**
 * A reminder counts as answered by a review on its day, unless that review
 * belongs to a different gap. Unprompted reviews carry no gap, so they can
 * answer whatever was due that day.
 */
const isAnsweredBy = (occurrence: Reminder, review: NoteReview): boolean =>
    review.localDate === occurrence.localDate &&
    // gapIndex is a position in a rolling list, not an identity. Persisted
    // occurrence timestamps survive earlier appointments leaving that list.
    (review.occurrenceAtUtc == null || review.occurrenceAtUtc === occurrence.atUtc);

export function noteReviewProgress(
    params: NoteReviewProgressParams,
): NoteReviewProgress {
    const { createdAt, reviews, noteId, now = new Date(), ...scheduleInput } = params;

    const gapIndex = gapIndexForTimestamp(createdAt, scheduleInput.sessionsUtc);
    if (gapIndex === null) return EMPTY;

    const occurrences = occurrencesForGap(gapIndex, scheduleInput);
    if (occurrences.length === 0) return { ...EMPTY, gapIndex };

    const relevant = noteId ? reviews.filter((r) => r.noteId === noteId) : reviews;
    const nowMs = now.getTime();

    let completed = 0;
    let missed = 0;
    let upcoming = 0;
    let openOccurrence: Reminder | null = null;
    let nextOccurrence: Reminder | null = null;

    const segments: ReviewSegment[] = occurrenceWindows(occurrences).map((window) => {
        const { occurrence, atMs, closesAtMs } = window;

        if (relevant.some((review) => isAnsweredBy(occurrence, review))) {
            completed += 1;
            return { occurrence, status: 'done' };
        }

        if (nowMs < atMs) {
            upcoming += 1;
            if (!nextOccurrence) nextOccurrence = occurrence;
            return { occurrence, status: 'upcoming' };
        }

        if (nowMs < closesAtMs) {
            openOccurrence = occurrence;
            return { occurrence, status: 'open' };
        }

        missed += 1;
        return { occurrence, status: 'missed' };
    });

    const total = segments.length;

    return {
        gapIndex,
        segments,
        total,
        completed,
        missed,
        upcoming,
        ratio: total > 0 ? completed / total : 0,
        openOccurrence,
        nextOccurrence,
        hasSchedule: total > 0,
        isComplete: total > 0 && completed === total,
    };
}

export interface NoteReviewSummary {
    count: number;
    lastReviewedAt: number | null;
    /** Day keys this note was reviewed on, most recent first. */
    days: string[];
}

const emptySummary = (): NoteReviewSummary => ({
    count: 0,
    lastReviewedAt: null,
    days: [],
});

/** Groups review rows by note, for a count alongside the bar. */
export function summariseReviewsByNote(
    reviews: NoteReview[],
): Record<string, NoteReviewSummary> {
    const byNote: Record<string, NoteReviewSummary> = {};

    for (const review of reviews) {
        const summary = byNote[review.noteId] ?? emptySummary();
        summary.count += 1;
        summary.days.push(review.localDate);
        summary.lastReviewedAt = Math.max(
            summary.lastReviewedAt ?? review.reviewedAt,
            review.reviewedAt,
        );
        byNote[review.noteId] = summary;
    }

    for (const summary of Object.values(byNote)) {
        summary.days.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    }

    return byNote;
}
