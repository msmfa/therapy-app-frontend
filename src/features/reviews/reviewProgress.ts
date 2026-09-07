// How far through its reviews one note is.
//
// The unit is the gap between two sessions, not a calendar week: one note per
// gap, and the gap's own reminders are the whole of what that note is ever
// asked for. So a note has a fixed denominator the moment its gap exists -
// typically four - and the card can draw a bar that fills as the reminders are
// answered.
import { Reason, type Reminder } from '../reminders/types';
import { occurrenceWindows } from './reviewAttribution';
import { gapIndexForReview, occurrencesForGap, reviewGapBounds, type ReviewOccurrence, type ReviewScheduleInput } from './reviewSchedule';
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
 * New rows identify the logical reminder, independent of rescheduled clock
 * times and rolling gap positions. Older rows lack session identities, so
 * recover only what their recorded kind, day and instant can establish.
 */
export function isOccurrenceAnswered(
    occurrence: ReviewOccurrence,
    review: NoteReview,
    gapBounds: [number, number] | null,
): boolean {
    if (review.occurrenceId) return review.occurrenceId === occurrence.occurrenceId;
    if (review.occurrenceAtUtc != null) {
        if (review.reason !== occurrence.reason) return false;
        if (review.occurrenceAtUtc === occurrence.atUtc) return true;
        const recordedAt = Date.parse(review.occurrenceAtUtc);
        if (!gapBounds || recordedAt < gapBounds[0] || recordedAt >= gapBounds[1] || !Number.isFinite(recordedAt)) return false;
        // There is only one of each other kind per gap. Repeated legacy mids
        // need their recorded day too: the old zone/anchor cannot be recovered.
        return occurrence.reason !== Reason.MidSession || review.localDate === occurrence.localDate;
    }
    return review.localDate === occurrence.localDate
        && (review.gapIndex === null || review.gapIndex === occurrence.gapIndex);
}

export function noteReviewProgress(
    params: NoteReviewProgressParams,
): NoteReviewProgress {
    const { createdAt, reviews, noteId, now = new Date(), ...scheduleInput } = params;

    const relevant = noteId ? reviews.filter((r) => r.noteId === noteId) : reviews;
    const gapIndex = gapIndexForReview(createdAt, scheduleInput, relevant);
    if (gapIndex === null) return EMPTY;

    const occurrences = occurrencesForGap(gapIndex, scheduleInput);
    if (occurrences.length === 0) return { ...EMPTY, gapIndex };

    const gapBounds = reviewGapBounds(gapIndex, scheduleInput);
    const nowMs = now.getTime();

    let completed = 0;
    let missed = 0;
    let upcoming = 0;
    let openOccurrence: Reminder | null = null;
    let nextOccurrence: Reminder | null = null;

    const segments: ReviewSegment[] = occurrenceWindows(occurrences).map((window) => {
        const { occurrence, atMs, closesAtMs } = window;

        if (relevant.some((review) => isOccurrenceAnswered(occurrence, review, gapBounds))) {
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
