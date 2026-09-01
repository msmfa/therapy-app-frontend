// Hard-coded progress states, for eyeballing the looks the bar can take.
//
// Temporary scaffolding: NoteCard falls back to these only while no real
// progress is passed in. Once the card is wired to `progressFor(note)` from
// `useNoteReviews`, delete this file and the fallback that reads it.
//
// These double as the explainer shown at the top of the notes list, so the
// labels are written for the person using the app, not for us: what the bar is
// telling them, rather than the fraction behind it. A gap can hold anywhere
// from 2 reminders to 10, so naming counts would be wrong as often as right.
import { Reason, type Reminder } from '../../features/reminders/types';
import type { NoteReviewProgress, ReviewSegment } from '../../features/reviews';

const occurrence = (index: number): Reminder => ({
    atUtc: new Date(Date.UTC(2024, 0, 1 + index, 20)).toISOString(),
    reason: index === 0 ? Reason.PostSession : Reason.MidSession,
    gapIndex: 0,
    localDate: `2024-01-${String(index + 1).padStart(2, '0')}`,
});

const makeProgress = (completed: number, total: number): NoteReviewProgress => {
    const segments: ReviewSegment[] = Array.from({ length: total }, (_, index) => ({
        occurrence: occurrence(index),
        status: index < completed ? 'done' : 'upcoming',
    }));

    return {
        gapIndex: 0,
        segments,
        total,
        completed,
        missed: 0,
        upcoming: total - completed,
        ratio: total > 0 ? completed / total : 0,
        openOccurrence: null,
        nextOccurrence: segments[completed]?.occurrence ?? null,
        hasSchedule: total > 0,
        isComplete: total > 0 && completed === total,
    };
};

const NO_SCHEDULE: NoteReviewProgress = {
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

export interface ReviewProgressPreview {
    label: string;
    progress: NoteReviewProgress;
}

export const REVIEW_PROGRESS_PREVIEWS: ReviewProgressPreview[] = [
    { label: 'Not reviewed yet', progress: NO_SCHEDULE },
    { label: 'Reviewed once', progress: makeProgress(1, 4) },
    { label: 'Halfway through', progress: makeProgress(2, 4) },
    { label: 'Almost there', progress: makeProgress(3, 4) },
    { label: 'All done', progress: makeProgress(4, 4) },
];

/**
 * The single state a card at `index` shows. Wraps, so a list shorter than the
 * set still walks through the first few looks in order.
 */
export const previewForCard = (index: number): ReviewProgressPreview =>
    REVIEW_PROGRESS_PREVIEWS[index % REVIEW_PROGRESS_PREVIEWS.length];
