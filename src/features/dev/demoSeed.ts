// Writing the "Sarah" demo account's on-device data, for product screenshots.
//
// Notes and review ticks never leave the phone: notes live in `notes.db`
// encrypted with a key held in the device keychain, and review rows sit beside
// them. A server-side seed can give the demo account its sessions and its
// reminder plan, but not one word of note content. This fills that half in.
//
// What to write is decided in demoSeedPlan.ts, which has no IO and is tested.
// This file is the IO: encrypt, insert, mark done.
//
// Notes go through `encryptNoteText`, the same call `addNote` makes, rather
// than being inserted as plaintext. A plaintext row would be rewritten by
// `migratePlaintextNotes` on first read and would still work, but it would mean
// the screenshots were taken against a path no real user takes.
//
// Dev only. `isDemoSeedEnabled` requires `__DEV__`, which is false in any
// production bundle.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TherapySession } from '../../api/therapy';
import { encryptNoteText } from '../notes/noteCrypto';
import { createNoteId, getNotesDb } from '../notes/useNotes';
import { recordReview } from '../reviews/reviewStore';
import { planDemoSeed } from './demoSeedPlan';

/** Bumped when the seeded content changes, so an existing install reseeds. */
const SEED_VERSION = 'v1';
const SEED_MARKER_PREFIX = 'dev:demoSeed:';

const markerKey = (userId: string) => `${SEED_MARKER_PREFIX}${SEED_VERSION}:${userId}`;

export function isDemoSeedEnabled(): boolean {
    return __DEV__ && process.env.EXPO_PUBLIC_SEED_DEMO === '1';
}

export async function hasSeeded(userId: string): Promise<boolean> {
    try {
        return (await AsyncStorage.getItem(markerKey(userId))) === '1';
    } catch {
        return false;
    }
}

export interface DemoSeedResult {
    notesWritten: number;
    reviewsWritten: number;
}

/**
 * Writes Sarah's notes and review history for `userId`.
 *
 * Idempotent twice over: by marker, and by content. A note whose timestamp is
 * already present for this user is not written again, and `recordReview`
 * ignores a duplicate tick, so an interrupted run resumes cleanly.
 */
export async function seedDemoData(
    userId: string,
    scheduleSessions: TherapySession[],
    timeZone: string,
    now: Date = new Date(),
): Promise<DemoSeedResult> {
    const plan = planDemoSeed(scheduleSessions, timeZone, now);
    if (plan.length === 0) {
        return { notesWritten: 0, reviewsWritten: 0 };
    }

    const db = await getNotesDb();

    let notesWritten = 0;
    let reviewsWritten = 0;

    for (const planned of plan) {
        const existing = await db.getFirstAsync<{ id: string }>(
            `SELECT id FROM notes WHERE userId = ? AND createdAt = ?`,
            userId,
            planned.createdAt,
        );

        const noteId = existing?.id ?? createNoteId(planned.createdAt);

        if (!existing) {
            await db.runAsync(
                `INSERT INTO notes (id, userId, text, createdAt) VALUES (?, ?, ?, ?)`,
                noteId,
                userId,
                await encryptNoteText(planned.text),
                planned.createdAt,
            );
            notesWritten += 1;
        }

        for (const review of planned.reviews) {
            const recorded = await recordReview(
                userId,
                noteId,
                {
                    localDate: review.localDate,
                    reason: review.reason,
                    occurrenceAtUtc: review.occurrenceAtUtc,
                    gapIndex: review.gapIndex,
                },
                review.reviewedAt,
            );
            if (recorded) reviewsWritten += 1;
        }
    }

    await AsyncStorage.setItem(markerKey(userId), '1');

    return { notesWritten, reviewsWritten };
}

/** Clears the marker so the next launch reseeds. Handy between screenshot runs. */
export async function resetDemoSeed(userId: string): Promise<void> {
    await AsyncStorage.removeItem(markerKey(userId));
}
