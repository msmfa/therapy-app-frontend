import * as React from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { cancelNotificationById } from '../../services/notifications';

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
        })();
    }

    await initPromise;
    return db;
};

const sortNotes = (items: Note[]) => [...items].sort((a, b) => b.createdAt - a.createdAt);

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

    const refresh = React.useCallback(async (): Promise<void> => {
        if (!userId) {
            setNotes([]);
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const db = await getDb();
            const rows = await db.getAllAsync<SqlRow>(
                `SELECT id, text, createdAt, remindAt, notifId
                 FROM notes
                 WHERE userId = ?
                 ORDER BY createdAt DESC`,
                userId,
            );

            const loaded: Note[] = rows.map((row) => ({
                id: row.id,
                text: row.text,
                createdAt: row.createdAt,
                remindAt: row.remindAt ?? undefined,
                notifId: row.notifId ?? undefined,
            }));

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
            if (!clean || !userId) return;

            const now = Date.now();
            const note: Note = { id: String(now), text: clean, createdAt: now };

            try {
                const db = await getDb();
                await db.runAsync(
                    `INSERT INTO notes (id, userId, text, createdAt)
                     VALUES (?, ?, ?, ?)`,
                    note.id,
                    userId,
                    note.text,
                    note.createdAt,
                );
                setNotes((prev) => sortNotes([note, ...prev]));
                setError(null);
            } catch (err) {
                console.warn('useNotes.addNote', err);
                setError('Failed to add note');
            }
        },
        [userId],
    );

    const updateNote = React.useCallback(
        async (id: string, patch: Partial<Pick<Note, 'text' | 'remindAt' | 'notifId'>>): Promise<void> => {
            if (!userId) return;

            const updates: string[] = [];
            const values: Array<string | number | null> = [];

            if (Object.prototype.hasOwnProperty.call(patch, 'text')) {
                updates.push('text = ?');
                values.push(patch.text ?? null);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'remindAt')) {
                updates.push('remindAt = ?');
                values.push(patch.remindAt ?? null);
            }
            if (Object.prototype.hasOwnProperty.call(patch, 'notifId')) {
                updates.push('notifId = ?');
                values.push(patch.notifId ?? null);
            }

            if (updates.length === 0) return;

            try {
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
