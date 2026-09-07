import type { SQLiteDatabase } from 'expo-sqlite';

type ReviewSchemaDatabase = Pick<SQLiteDatabase, 'getAllAsync' | 'execAsync'>;

/** Add review identities without rebuilding the table or inventing legacy IDs. */
export async function migrateReviewIdentity(db: ReviewSchemaDatabase): Promise<void> {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(note_reviews)');
    if (!columns.some((column) => column.name === 'occurrenceId')) {
        await db.execAsync('ALTER TABLE note_reviews ADD COLUMN occurrenceId TEXT;');
    }

    // A schedule edit can move a reviewed slot onto another day. Keep the
    // existing daily limit and also prevent a second tick for that same slot.
    // Legacy rows stay null and are excluded from this new constraint.
    await db.execAsync(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_note_reviews_note_occurrence
         ON note_reviews (noteId, occurrenceId) WHERE occurrenceId IS NOT NULL;`,
    );
}
