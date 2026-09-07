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
    gapIndexForReview,
    occurrencesForGap,
    reviewGapBounds,
    type ReviewScheduleInput,
} from './reviewSchedule';
import {
    listReviewsForUser,
    backfillReviewIdentities,
    recordReview,
    removeReview,
    type NoteReview,
} from './reviewStore';
import {
    noteReviewProgress,
    isOccurrenceAnswered,
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
    // scheduleSessions, not sessions: the editable list starts at local
    // midnight today, so the session that opened a note's gap has usually
    // already fallen out of it by the time a reminder is answered, and the
    // note could no longer be attributed to any gap.
    const { scheduleSessions, reminderScheduleSettings, reminderScheduleStatus } = useTherapySessions();
    const deviceTimeZone = useDeviceTimeZone();
    const timeZone = reminderScheduleSettings?.timeZone ?? deviceTimeZone;

    const [reviews, setReviews] = React.useState<NoteReview[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);
    const refreshRequestRef = React.useRef(0);
    const pendingRefreshRef = React.useRef(false);
    const ownerRef = React.useRef(userId);
    ownerRef.current = userId;

    const scheduleInput = React.useMemo<ReviewScheduleInput>(
        () => ({
            ...sessionScheduleInputs(scheduleSessions),
            sessionIdsByStart: Object.fromEntries(scheduleSessions
                .filter((session) => session._id && session.startsAtUtc)
                .map((session) => [session.startsAtUtc, session._id])),
            timeZone,
            morningMinutes: reminderScheduleSettings?.morningReminderMinutes,
            reflectionMinutes: reminderScheduleSettings?.eveningReminderMinutes,
        }),
        [scheduleSessions, timeZone, reminderScheduleSettings],
    );

    const refresh = React.useCallback(async (): Promise<void> => {
        const request = ++refreshRequestRef.current;
        pendingRefreshRef.current = true;
        const isCurrent = () => request === refreshRequestRef.current && ownerRef.current === userId;
        if (!userId) {
            setReviews([]);
            setLoading(false);
            setError(null);
            pendingRefreshRef.current = false;
            return;
        }

        try {
            let restored = await listReviewsForUser(userId);
            if (!isCurrent()) return;
            if (reminderScheduleStatus === 'ready' && reminderScheduleSettings !== null
                && restored.some((review) => !review.occurrenceId && review.occurrenceAtUtc && review.reason)) {
                const occurrences = Array.from({ length: Math.max(0, scheduleInput.sessionsUtc.length - 1) },
                    (_, gapIndex) => occurrencesForGap(gapIndex, scheduleInput)).flat();
                try {
                    restored = await backfillReviewIdentities(userId, restored, occurrences);
                } catch (err) {
                    // Existing reviews remain readable if upgrading their
                    // identity fails; a later hydration can retry safely.
                    console.warn('useNoteReviews.backfill', err);
                }
            }
            if (!isCurrent()) return;
            setReviews(restored);
            setError(null);
        } catch (err) {
            if (!isCurrent()) return;
            console.warn('useNoteReviews.refresh', err);
            setReviews([]);
            setError('Failed to load reviews');
        } finally {
            if (isCurrent()) {
                pendingRefreshRef.current = false;
                setLoading(false);
            }
        }
    }, [userId, reminderScheduleStatus, reminderScheduleSettings, scheduleInput]);

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
            const gapIndex = gapIndexForReview(note.createdAt, scheduleInput, reviews.filter((review) => review.noteId === note.id));
            const occurrences =
                gapIndex === null ? [] : occurrencesForGap(gapIndex, scheduleInput);

            return attributeReview({ occurrences, at, timeZone });
        },
        [reviews, scheduleInput, timeZone],
    );

    const hasAnswered = React.useCallback((noteId: string, attribution: ReviewAttribution): boolean =>
        reviews.some((review) => {
            if (review.noteId !== noteId) return false;
            // Keep the existing per-day limit as well as logical-slot identity.
            if (review.localDate === attribution.localDate) return true;
            if (attribution.reason === null || attribution.occurrenceAtUtc === null || attribution.gapIndex === null) return false;
            return isOccurrenceAnswered({
                reason: attribution.reason,
                localDate: attribution.localDate,
                atUtc: attribution.occurrenceAtUtc,
                gapIndex: attribution.gapIndex,
                occurrenceId: attribution.occurrenceId ?? undefined,
            }, review, reviewGapBounds(attribution.gapIndex, scheduleInput));
        }), [reviews, scheduleInput]);

    const markReviewed = React.useCallback(
        async (note: ReviewableNote, at: Date = new Date()): Promise<MarkReviewedResult> => {
            const attribution = attributionFor(note, at);
            if (!userId) return { recorded: false, attribution };
            if (hasAnswered(note.id, attribution)) return { recorded: false, attribution };

            try {
                const recorded = await recordReview(
                    userId,
                    note.id,
                    attribution,
                    at.getTime(),
                );

                if (recorded && ownerRef.current === userId) {
                    setReviews((prev) => [
                        {
                            noteId: note.id,
                            localDate: attribution.localDate,
                            reviewedAt: at.getTime(),
                            gapIndex: attribution.gapIndex,
                            reason: attribution.reason,
                            occurrenceAtUtc: attribution.occurrenceAtUtc,
                            occurrenceId: attribution.occurrenceId ?? null,
                        },
                        ...prev,
                    ]);
                    // A slow legacy upgrade may have read before this tick
                    // was saved. Replace that pending snapshot with a fresh
                    // read containing the mutation, including on first load.
                    if (pendingRefreshRef.current) void refresh();
                }

                setError(null);
                return { recorded, attribution };
            } catch (err) {
                console.warn('useNoteReviews.markReviewed', err);
                setError('Failed to save review');
                throw new Error('Failed to save review. Please try again.');
            }
        },
        [attributionFor, hasAnswered, refresh, userId],
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
            return hasAnswered(note.id, attributionFor(note, at));
        },
        [attributionFor, hasAnswered],
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
            const alreadyReviewed = hasAnswered(note.id, attribution);
            const withinWindow = attribution.reason !== null;

            return {
                attribution,
                alreadyReviewed,
                withinWindow,
                canReview: withinWindow && !alreadyReviewed,
            };
        },
        [attributionFor, hasAnswered],
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
