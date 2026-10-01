import type { SQLiteDatabase } from 'expo-sqlite';
import { getCurrentUserSettings } from '../../api/users';
import { getNotesDb } from './useNotes';
import { notifyProgressChanged } from '../widgets/progressEvents';

const accountId = /^[a-f0-9]{24}$/;

/** Only call with former identities verified by the authenticated server. */
export async function migrateVerifiedNoteOwners(
    db: SQLiteDatabase,
    currentId: string,
    formerIds: string[],
    isCurrent: () => boolean,
): Promise<number> {
    if (!accountId.test(currentId) || formerIds.some((id) => !accountId.test(id))) {
        throw new Error('Invalid note recovery identity');
    }
    const aliases = [...new Set(formerIds)].filter((id) => id !== currentId);
    if (aliases.length === 0) return 0;
    let recovered = 0;
    const checkOwner = () => {
        if (!isCurrent()) throw new Error('Account changed during note recovery');
    };
    await db.withExclusiveTransactionAsync(async (transaction) => {
        checkOwner();
        // Keep an audit of ownership changes. Note bodies, IDs, timestamps and
        // notification IDs are untouched; a failure rolls the whole move back.
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS note_owner_recovery (
            noteId TEXT NOT NULL, formerUserId TEXT NOT NULL, userId TEXT NOT NULL,
            recoveredAt INTEGER NOT NULL, PRIMARY KEY (noteId, formerUserId, userId)
        );`);
        for (const formerId of aliases) {
            checkOwner();
            await transaction.runAsync(
                `INSERT OR IGNORE INTO note_owner_recovery (noteId, formerUserId, userId, recoveredAt)
                 SELECT id, userId, ?, ? FROM notes WHERE userId = ?`,
                currentId, Date.now(), formerId,
            );
            await transaction.runAsync(
                `UPDATE note_reviews SET userId = ? WHERE userId = ?
                 AND noteId IN (SELECT id FROM notes WHERE userId = ?)`,
                currentId, formerId, formerId,
            );
            const result = await transaction.runAsync(
                'UPDATE notes SET userId = ? WHERE userId = ?', currentId, formerId,
            );
            recovered += result.changes;
        }
        checkOwner();
    });
    if (recovered > 0) notifyProgressChanged();
    return recovered;
}

/** User-initiated recovery. No note text or local inventory leaves the device. */
export async function recoverAccountNotes(userId: string, isCurrent: () => boolean): Promise<number> {
    const settings = await getCurrentUserSettings();
    if (!isCurrent() || settings.id !== userId) throw new Error('Recovery account does not match');
    const aliases = settings.localNoteRecoveryUserIds ?? [];
    if (!Array.isArray(aliases) || aliases.some((id) => typeof id !== 'string')) {
        throw new Error('Invalid note recovery response');
    }
    if (aliases.length === 0) return 0;
    return migrateVerifiedNoteOwners(await getNotesDb(), userId, aliases, isCurrent);
}
