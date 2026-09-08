// Persistence for review ticks.
//
// Rows live in the same `notes.db` as the notes themselves, and go through
// `getNotesDb` so they share one initialisation. Nothing here reaches the
// backend: a review is metadata about a therapy note, and notes have never
// left the device.
import { getNotesDb } from '../notes/useNotes';
import { Reason } from '../reminders/types';
import type { ReviewAttribution } from './reviewAttribution';
import type { ReviewOccurrence } from './reviewSchedule';

export interface NoteReview {
    noteId: string;
    /** `YYYY-MM-DD` in the user's zone, from the attributed occurrence. */
    localDate: string;
    /** When the user actually ticked, which can be a different day. */
    reviewedAt: number;
    gapIndex: number | null;
    reason: Reason | null;
    occurrenceAtUtc: string | null;
    occurrenceId?: string | null;
}

interface ReviewRow {
    noteId: string;
    localDate: string;
    reviewedAt: number;
    gapIndex: number | null;
    reason: string | null;
    occurrenceAtUtc: string | null;
    occurrenceId?: string | null;
}

const REASONS = new Set<string>(Object.values(Reason));

const toReview = (row: ReviewRow): NoteReview => ({
    noteId: row.noteId,
    localDate: row.localDate,
    reviewedAt: row.reviewedAt,
    gapIndex: row.gapIndex ?? null,
    reason: row.reason && REASONS.has(row.reason) ? (row.reason as Reason) : null,
    occurrenceAtUtc: row.occurrenceAtUtc ?? null,
    occurrenceId: row.occurrenceId ?? null,
});

const SELECT_COLUMNS = `noteId, localDate, reviewedAt, gapIndex, reason, occurrenceAtUtc, occurrenceId`;

/** Upgrade only legacy rows whose original instant and kind identify one slot. */
export async function backfillReviewIdentities(
    userId: string,
    reviews: NoteReview[],
    occurrences: ReviewOccurrence[],
): Promise<NoteReview[]> {
    if (!userId) return reviews;
    const byInstantAndKind = new Map<string, ReviewOccurrence[]>();
    for (const occurrence of occurrences) {
        if (!occurrence.occurrenceId) continue;
        const key = `${Date.parse(occurrence.atUtc)}:${occurrence.reason}`;
        byInstantAndKind.set(key, [...(byInstantAndKind.get(key) ?? []), occurrence]);
    }

    const restored = [...reviews];
    for (let index = 0; index < reviews.length; index += 1) {
        const review = reviews[index];
        if (review.occurrenceId || !review.occurrenceAtUtc || review.reason === null) continue;
        const at = Date.parse(review.occurrenceAtUtc);
        if (!Number.isFinite(at)) continue;
        const matches = byInstantAndKind.get(`${at}:${review.reason}`);
        if (matches?.length !== 1) continue;

        const occurrenceId = matches[0].occurrenceId!;
        const db = await getNotesDb();
        // A concurrently inserted identified row may already occupy this slot.
        // Ignore that conflict rather than deleting or merging either review.
        const result = await db.runAsync(
            `UPDATE OR IGNORE note_reviews SET occurrenceId = ?
             WHERE userId = ? AND noteId = ? AND localDate = ? AND reviewedAt = ?
               AND occurrenceAtUtc = ? AND reason = ? AND occurrenceId IS NULL`,
            occurrenceId, userId, review.noteId, review.localDate, review.reviewedAt,
            review.occurrenceAtUtc, review.reason,
        );
        if (result.changes > 0) restored[index] = { ...review, occurrenceId };
    }
    return restored;
}

/**
 * Records one review, returning false when the note was already reviewed for
 * that day.
 *
 * The per-day rule is enforced by the unique index rather than by a read then a
 * write, so two taps racing each other cannot both land.
 */
export async function recordReview(
    userId: string,
    noteId: string,
    attribution: ReviewAttribution,
    reviewedAt: number,
): Promise<boolean> {
    if (!userId || !noteId) return false;

    const db = await getNotesDb();
    const result = await db.runAsync(
        `INSERT OR IGNORE INTO note_reviews
            (noteId, userId, localDate, reviewedAt, gapIndex, reason, occurrenceAtUtc, occurrenceId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        noteId,
        userId,
        attribution.localDate,
        reviewedAt,
        attribution.gapIndex,
        attribution.reason,
        attribution.occurrenceAtUtc,
        attribution.occurrenceId ?? null,
    );

    return result.changes > 0;
}

export async function listReviewsForUser(userId: string): Promise<NoteReview[]> {
    if (!userId) return [];

    const db = await getNotesDb();
    const rows = await db.getAllAsync<ReviewRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM note_reviews
         WHERE userId = ?
         ORDER BY localDate DESC`,
        userId,
    );

    return rows.map(toReview);
}

export async function listReviewsForNote(
    userId: string,
    noteId: string,
): Promise<NoteReview[]> {
    if (!userId || !noteId) return [];

    const db = await getNotesDb();
    const rows = await db.getAllAsync<ReviewRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM note_reviews
         WHERE userId = ? AND noteId = ?
         ORDER BY localDate DESC`,
        userId,
        noteId,
    );

    return rows.map(toReview);
}

/** Undoes one tick. Without `localDate`, removes the note's most recent one. */
export async function removeReview(
    userId: string,
    noteId: string,
    localDate?: string,
): Promise<boolean> {
    if (!userId || !noteId) return false;

    const db = await getNotesDb();

    if (localDate) {
        const result = await db.runAsync(
            `DELETE FROM note_reviews WHERE userId = ? AND noteId = ? AND localDate = ?`,
            userId,
            noteId,
            localDate,
        );
        return result.changes > 0;
    }

    const result = await db.runAsync(
        `DELETE FROM note_reviews
         WHERE rowid = (
            SELECT rowid FROM note_reviews
            WHERE userId = ? AND noteId = ?
            ORDER BY reviewedAt DESC
            LIMIT 1
         )`,
        userId,
        noteId,
    );

    return result.changes > 0;
}

export async function clearReviewsForUser(userId: string): Promise<void> {
    if (!userId) return;

    const db = await getNotesDb();
    await db.runAsync(`DELETE FROM note_reviews WHERE userId = ?`, userId);
}
