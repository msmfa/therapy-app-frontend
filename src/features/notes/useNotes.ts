import * as React from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { cancelNotificationById } from '../../services/notifications';
import { encryptNoteText, decryptNoteText, isEncrypted } from './noteCrypto';

type SqlRow = {
    id: string;
    userId: string;
    text: string;
    createdAt: number;
    remindAt: number | null;
    notifId: string | null;
};

export type Note = {
    id: string;
    text: string;
    createdAt: number;
    remindAt?: number;
    notifId?: string;
};

/**
 * `id` is the table's global PRIMARY KEY, shared across every user on the
 * device. Using the raw millisecond timestamp meant two notes saved in the
 * same millisecond collided on insert and the second one was silently lost
 * behind a "Failed to add note" toast. The random suffix removes that.
 */
export const createNoteId = (now: number = Date.now()): string =>
    `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const dbPromise = openDatabaseAsync('notes.db');
let initPromise: Promise<void> | null = null;

const getDb = async (): Promise<SQLiteDatabase> => {
    const db = await dbPromise;

    if (!initPromise) {
        initPromise = (async () => {
            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY NOT NULL,
                    userId TEXT NOT NULL,
                    text TEXT NOT NULL,
                    createdAt INTEGER NOT NULL,
                    remindAt INTEGER,
                    notifId TEXT
                );`,
            );
            await db.execAsync(
                `CREATE INDEX IF NOT EXISTS idx_notes_user_createdAt
                 ON notes (userId, createdAt DESC);`,
            );
            // One row per note per attributed day. The unique index below is
            // what enforces "a note counts once a day" - a second tick on the
            // same day is a no-op rather than an inflated count.
            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS note_reviews (
                    noteId TEXT NOT NULL,
                    userId TEXT NOT NULL,
                    localDate TEXT NOT NULL,
                    reviewedAt INTEGER NOT NULL,
                    gapIndex INTEGER,
                    reason TEXT,
                    occurrenceAtUtc TEXT
                );`,
            );
            await db.execAsync(
                `CREATE UNIQUE INDEX IF NOT EXISTS idx_note_reviews_note_day
                 ON note_reviews (noteId, localDate);`,
            );
            await db.execAsync(
                `CREATE INDEX IF NOT EXISTS idx_note_reviews_user_date
                 ON note_reviews (userId, localDate);`,
            );
        })();
    }

    await initPromise;
    return db;
};

/**
 * The reviews feature stores its rows in this same database, so it has to go
 * through the same initialisation rather than opening `notes.db` a second time.
 */
export const getNotesDb = getDb;

const sortNotes = (items: Note[]) => [...items].sort((a, b) => b.createdAt - a.createdAt);

/**
 * Re-writes any note still stored as plaintext.
 *
 * Notes written before encryption existed stay readable either way, but
 * leaving them in the clear would mean the protection only ever applied to
 * new notes. Each row is converted individually so one undecryptable row
 * cannot abort the whole pass.
 */
export async function migratePlaintextNotes(
    db: SQLiteDatabase,
    userId: string,
): Promise<number> {
    const rows = await db.getAllAsync<{ id: string; text: string }>(
        `SELECT id, text FROM notes WHERE userId = ?`,
        userId,
    );

    const plaintextRows = rows.filter((row) => !isEncrypted(row.text));
    if (plaintextRows.length === 0) return 0;

    let migrated = 0;
    for (const row of plaintextRows) {
        try {
            const sealed = await encryptNoteText(row.text);
            await db.runAsync(
                `UPDATE notes SET text = ? WHERE id = ? AND userId = ?`,
                sealed,
                row.id,
                userId,
            );
            migrated += 1;
        } catch (err) {
            console.warn('useNotes.migratePlaintextNotes', row.id, err);
        }
    }

    return migrated;
}

/**
 * Decrypts a row for display. A row that will not open (key replaced, storage
 * corruption) must not take the whole list down with it, so it degrades to a
 * placeholder and the rest of the notes still render.
 */
const readRowText = async (row: Pick<SqlRow, 'id' | 'text'>): Promise<string> => {
    try {
        return await decryptNoteText(row.text);
    } catch (err) {
        console.warn('useNotes.decrypt', row.id, err);
        return '';
    }
};

async function deleteNotesForUser(db: SQLiteDatabase, userId: string) {
    const rows = await db.getAllAsync<{ notifId: string | null }>(
        `SELECT notifId FROM notes WHERE userId = ?`,
        userId,
    );

    const cancellations = rows
        .map((row) => row.notifId)
        .filter((notifId): notifId is string => Boolean(notifId))
        .map((notifId) => cancelNotificationById(notifId).catch(() => {}));

    if (cancellations.length > 0) {
        await Promise.all(cancellations);
    }

    await db.runAsync(`DELETE FROM note_reviews WHERE userId = ?`, userId);
    await db.runAsync(`DELETE FROM notes WHERE userId = ?`, userId);
}

export const clearNotesForUser = async (userId: string): Promise<void> => {
    if (!userId) {
        return;
    }

    try {
        const db = await getDb();
        await deleteNotesForUser(db, userId);
    } catch (error) {
        console.warn('clearNotesForUser', error);
        throw new Error('Failed to clear local notes');
    }
};

export function useNotes(userId: string | undefined) {
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string | null>(null);

    const refresh = React.useCallback(async (options?: { silent?: boolean }): Promise<void> => {
        if (!userId) {
            setNotes([]);
            setLoading(false);
            setError(null);
            return;
        }

        try {
            if (!options?.silent) setLoading(true);
            const db = await getDb();

            // Bring any pre-encryption rows up to date before reading, so the
            // plaintext window closes on first launch after upgrading.
            await migratePlaintextNotes(db, userId).catch((err) => {
                console.warn('useNotes.migrate', err);
            });

            const rows = await db.getAllAsync<SqlRow>(
                `SELECT id, text, createdAt, remindAt, notifId
                 FROM notes
                 WHERE userId = ?
                 ORDER BY createdAt DESC`,
                userId,
            );

            const loaded: Note[] = await Promise.all(
                rows.map(async (row) => ({
                    id: row.id,
                    text: await readRowText(row),
                    createdAt: row.createdAt,
                    remindAt: row.remindAt ?? undefined,
                    notifId: row.notifId ?? undefined,
                })),
            );

            setNotes(sortNotes(loaded));
            setError(null);
        } catch (err) {
            console.warn('useNotes.refresh', err);
            setNotes([]);
            setError('Failed to load notes');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    React.useEffect(() => {
        refresh().catch(() => {});
    }, [refresh]);

    const addNote = React.useCallback(
        async (text: string): Promise<void> => {
            const clean = text.trim();
            if (!userId) throw new Error('Sign in to save a note.');
            if (!clean) throw new Error('Notes cannot be empty.');

            const now = Date.now();
            const note: Note = { id: createNoteId(now), text: clean, createdAt: now };

            try {
                const db = await getDb();
                // `note` keeps the plaintext for in-memory state; only the
                // encrypted form is ever written to disk.
                const sealed = await encryptNoteText(note.text);
                await db.runAsync(
                    `INSERT INTO notes (id, userId, text, createdAt)
                     VALUES (?, ?, ?, ?)`,
                    note.id,
                    userId,
                    sealed,
                    note.createdAt,
                );
                setNotes((prev) => sortNotes([note, ...prev]));
                setError(null);
            } catch (err) {
                console.warn('useNotes.addNote', err);
                setError('Failed to add note');
                throw new Error('Unable to save note right now.');
            }
        },
        [userId],
    );

    const updateNote = React.useCallback(
        async (id: string, patch: Partial<Pick<Note, 'text' | 'remindAt' | 'notifId'>>): Promise<void> => {
            if (!userId) throw new Error('Sign in to save a note.');

            const updates: string[] = [];
            const values: Array<string | number | null> = [];

            if (Object.prototype.hasOwnProperty.call(patch, 'remindAt')) {
                updates.push('remindAt = ?');
                values.push(patch.remindAt ?? null);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'notifId')) {
                updates.push('notifId = ?');
                values.push(patch.notifId ?? null);
            }

            if (!Object.prototype.hasOwnProperty.call(patch, 'text') && updates.length === 0) {
                return;
            }

            try {
                // Encrypting can fail (keychain unavailable while locked), so
                // it belongs inside the same guard as the write itself.
                if (Object.prototype.hasOwnProperty.call(patch, 'text')) {
                    updates.unshift('text = ?');
                    values.unshift(
                        typeof patch.text === 'string'
                            ? await encryptNoteText(patch.text)
                            : null,
                    );
                }

                const db = await getDb();
                await db.runAsync(
                    `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
                    ...values,
                    id,
                    userId,
                );
                setNotes((prev) =>
                    sortNotes(prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
                );
                setError(null);
            } catch (err) {
                console.warn('useNotes.updateNote', err);
                setError('Failed to update note');
                throw new Error('Unable to update note right now.');
            }
        },
        [userId],
    );

    const deleteNote = React.useCallback(
        async (id: string): Promise<void> => {
            if (!userId) return;

            const target = notes.find((n) => n.id === id);
            if (target?.notifId) {
                cancelNotificationById(target.notifId).catch(() => {});
            }

            try {
                const db = await getDb();
                await db.runAsync(`DELETE FROM note_reviews WHERE noteId = ? AND userId = ?`, id, userId);
                await db.runAsync(`DELETE FROM notes WHERE id = ? AND userId = ?`, id, userId);
                setNotes((prev) => prev.filter((n) => n.id !== id));
                setError(null);
            } catch (err) {
                console.warn('useNotes.deleteNote', err);
                setError('Failed to delete note');
            }
        },
        [notes, userId],
    );

    const clearAll = React.useCallback(async (): Promise<void> => {
        if (!userId) return;

        try {
            const db = await getDb();
            await deleteNotesForUser(db, userId);
            setNotes([]);
            setError(null);
        } catch (err) {
            console.warn('useNotes.clearAll', err);
            setError('Failed to clear notes');
        }
    }, [userId]);

    return {
        notes,
        loading,
        error,
        refresh,
        addNote,
        updateNote,
        deleteNote,
        clearAll,
    };
}
