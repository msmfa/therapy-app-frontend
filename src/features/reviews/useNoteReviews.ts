// The hook the UI talks to.
//
// Everything below is local: sessions come from the context that already has
// them, the schedule is recomputed on device, and ticks go to `notes.db`.
import * as React from 'react';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import { useDeviceTimeZone } from '../../hooks/useDeviceTimeZone';
import { sessionScheduleInputs } from '../reminders/reminderScheduleConfig';
import { attributeReview, type ReviewAttribution } from './reviewAttribution';
import {
    gapIndexForTimestamp,
    occurrencesForGap,
    type ReviewScheduleInput,
} from './reviewSchedule';
import {
    listReviewsForUser,
    recordReview,
    removeReview,
    type NoteReview,
} from './reviewStore';
import {
    noteReviewProgress,
    summariseReviewsByNote,
    type NoteReviewProgress,
    type NoteReviewSummary,
} from './reviewProgress';

/** The minimum a note needs to be placed against the schedule. */
export interface ReviewableNote {
    id: string;
    createdAt: number;
}

export interface MarkReviewedResult {
    /** False when the note was already reviewed for the attributed day. */
    recorded: boolean;
    attribution: ReviewAttribution;
}

const EMPTY_SUMMARY: NoteReviewSummary = { count: 0, lastReviewedAt: null, days: [] };

export function useNoteReviews(userId: string | undefined) {
    const { sessions } = useTherapySessions();
    const timeZone = useDeviceTimeZone();

    const [reviews, setReviews] = React.useState<NoteReview[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const scheduleInput = React.useMemo<ReviewScheduleInput>(
        () => ({ ...sessionScheduleInputs(sessions), timeZone }),
        [sessions, timeZone],
    );

    const refresh = React.useCallback(async (): Promise<void> => {
        if (!userId) {
            setReviews([]);
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setReviews(await listReviewsForUser(userId));
            setError(null);
        } catch (err) {
            console.warn('useNoteReviews.refresh', err);
            setReviews([]);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => {
        refresh().catch(() => {});
    }, [refresh]);

    /**
     * Which occurrence a tick right now would answer, and therefore which day
     * it would count for. The UI needs this to decide whether the tick is
     * already done: the answer is not always "today", since an evening
     * reminder stays answerable past midnight.
     */
    const attributionFor = React.useCallback(
        (note: ReviewableNote, at: Date = new Date()): ReviewAttribution => {
            const gapIndex = gapIndexForTimestamp(note.createdAt, scheduleInput.sessionsUtc);
            const occurrences =
                gapIndex === null ? [] : occurrencesForGap(gapIndex, scheduleInput);

            return attributeReview({ occurrences, at, timeZone });
        },
        [scheduleInput, timeZone],
    );

    const markReviewed = React.useCallback(
        async (note: ReviewableNote, at: Date = new Date()): Promise<MarkReviewedResult> => {
            const attribution = attributionFor(note, at);
            if (!userId) return { recorded: false, attribution };

            try {
                const recorded = await recordReview(
                    userId,
                    note.id,
                    attribution,
                    at.getTime(),
                );

                if (recorded) {
                    setReviews((prev) => [
                        {
                            noteId: note.id,
                            localDate: attribution.localDate,
                            reviewedAt: at.getTime(),
                            gapIndex: attribution.gapIndex,
                            reason: attribution.reason,
                            occurrenceAtUtc: attribution.occurrenceAtUtc,
                        },
                        ...prev,
                    ]);
                }

                setError(null);
                return { recorded, attribution };
            } catch (err) {
                console.warn('useNoteReviews.markReviewed', err);
                setError('Failed to save review');
                return { recorded: false, attribution };
            }
        },
        [attributionFor, userId],
    );

    const undoReview = React.useCallback(
        async (noteId: string, localDate?: string): Promise<boolean> => {
            if (!userId) return false;

            try {
                const removed = await removeReview(userId, noteId, localDate);
                if (removed) {
                    await refresh();
                }
                setError(null);
                return removed;
            } catch (err) {
                console.warn('useNoteReviews.undoReview', err);
                setError('Failed to undo review');
                return false;
            }
        },
        [refresh, userId],
    );

    const summaries = React.useMemo(() => summariseReviewsByNote(reviews), [reviews]);

    const summaryFor = React.useCallback(
        (noteId: string): NoteReviewSummary => summaries[noteId] ?? EMPTY_SUMMARY,
        [summaries],
    );

    /** Whether a tick right now would be a no-op, for the button's state. */
    const isReviewed = React.useCallback(
        (note: ReviewableNote, at: Date = new Date()): boolean => {
            const { localDate } = attributionFor(note, at);
            return summaryFor(note.id).days.includes(localDate);
        },
        [attributionFor, summaryFor],
    );

    /**
     * Everything the review button needs.
     *
     * `canReview` is false in two different situations the UI does not need to
     * tell apart: no reminder is currently answerable (either none has fired or
     * the last one's window has closed), or this slot was already ticked. A
     * review outside a window would be recorded as unprompted and fill nothing,
     * so offering the button then would be a lie.
     */
    const reviewState = React.useCallback(
        (note: ReviewableNote, at: Date = new Date()) => {
            const attribution = attributionFor(note, at);
            const alreadyReviewed = summaryFor(note.id).days.includes(attribution.localDate);
            const withinWindow = attribution.reason !== null;

            return {
                attribution,
                alreadyReviewed,
                withinWindow,
                canReview: withinWindow && !alreadyReviewed,
            };
        },
        [attributionFor, summaryFor],
    );

    /** How far through its gap's reminders a note is, for the progress bar. */
    const progressFor = React.useCallback(
        (note: ReviewableNote, now?: Date): NoteReviewProgress =>
            noteReviewProgress({
                ...scheduleInput,
                createdAt: note.createdAt,
                noteId: note.id,
                reviews,
                now,
            }),
        [reviews, scheduleInput],
    );

    return {
        reviews,
        loading,
        error,
        refresh,
        markReviewed,
        undoReview,
        summaryFor,
        isReviewed,
        reviewState,
        attributionFor,
        progressFor,
    };
}
