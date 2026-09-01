// Persistence for review ticks.
//
// Rows live in the same `notes.db` as the notes themselves, and go through
// `getNotesDb` so they share one initialisation. Nothing here reaches the
// backend: a review is metadata about a therapy note, and notes have never
// left the device.
import { getNotesDb } from '../notes/useNotes';
import { Reason } from '../reminders/types';
import type { ReviewAttribution } from './reviewAttribution';

export interface NoteReview {
    noteId: string;
    /** `YYYY-MM-DD` in the user's zone, from the attributed occurrence. */
    localDate: string;
    /** When the user actually ticked, which can be a different day. */
    reviewedAt: number;
    gapIndex: number | null;
    reason: Reason | null;
    occurrenceAtUtc: string | null;
}

interface ReviewRow {
    noteId: string;
    localDate: string;
    reviewedAt: number;
    gapIndex: number | null;
    reason: string | null;
    occurrenceAtUtc: string | null;
}

const REASONS = new Set<string>(Object.values(Reason));

const toReview = (row: ReviewRow): NoteReview => ({
    noteId: row.noteId,
    localDate: row.localDate,
    reviewedAt: row.reviewedAt,
    gapIndex: row.gapIndex ?? null,
    reason: row.reason && REASONS.has(row.reason) ? (row.reason as Reason) : null,
    occurrenceAtUtc: row.occurrenceAtUtc ?? null,
});

const SELECT_COLUMNS = `noteId, localDate, reviewedAt, gapIndex, reason, occurrenceAtUtc`;

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
            (noteId, userId, localDate, reviewedAt, gapIndex, reason, occurrenceAtUtc)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        noteId,
        userId,
        attribution.localDate,
        reviewedAt,
        attribution.gapIndex,
        attribution.reason,
        attribution.occurrenceAtUtc,
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
