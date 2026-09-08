import * as SecureStore from 'expo-secure-store';
import { analytics } from './client';
import type { ReviewKind } from './events';

const STORAGE_KEY = 'analytics.engagement.v1';
const MAX_NOTES = 32;
const MAX_KEYS = 64;
type LocalNote = { id: string; savedVisit?: string; reviewed: boolean };
type LocalState = { owner: string; savedAny: boolean; reviewedAny: boolean; notes: LocalNote[]; keys: string[] };
let pending: Promise<void> = Promise.resolve();
let operationNumber = 0;
type Engagement = {
    noteSaved: (noteId: string, operation: 'new' | 'edit', isFirstStoredNote: () => Promise<boolean>) => void;
    reviewCompleted: (noteId: string, reviewedAt: number, reviewKind: ReviewKind,
        firstStoredReview: () => Promise<{ overall: boolean; forNote: boolean }>) => void;
    failed: (operation: 'note_save' | 'review_save') => void;
};

const enqueue = (operation: () => Promise<void>): Promise<void> => {
    pending = pending.then(operation).catch(() => undefined);
    return pending;
};

const emptyState = (owner: string): LocalState => ({ owner, savedAny: false, reviewedAny: false, notes: [], keys: [] });

async function readState(owner: string): Promise<LocalState> {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return emptyState(owner);
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return emptyState(owner);
    const value = parsed as Record<string, unknown>;
    if (value.owner !== owner) return emptyState(owner);
    const notes: LocalNote[] = [];
    if (Array.isArray(value.notes)) {
        for (const row of value.notes.slice(-MAX_NOTES) as unknown[]) {
            if (typeof row !== 'object' || row === null) continue;
            const note = row as Record<string, unknown>;
            if (typeof note.id !== 'string') continue;
            notes.push({ id: note.id, reviewed: note.reviewed === true,
                ...(typeof note.savedVisit === 'string' ? { savedVisit: note.savedVisit } : {}) });
        }
    }
    return { owner, savedAny: value.savedAny === true, reviewedAny: value.reviewedAny === true, notes,
        keys: Array.isArray(value.keys) ? value.keys.filter((key): key is string => typeof key === 'string').slice(-MAX_KEYS) : [] };
}

function remember(state: LocalState, note: LocalNote, key: string): void {
    state.notes = [...state.notes.filter((previous) => previous.id !== note.id), note].slice(-MAX_NOTES);
    state.keys = [...state.keys, key].slice(-MAX_KEYS);
}

// This sidecar never enters an event. One bounded encrypted record serves the
// current account; switching accounts can lose activation history, never share it.
try {
    analytics.registerCleanup((reason, accountId) => enqueue(async () => {
        if (reason === 'opt_out') {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
            return;
        }
        if (!accountId) return;
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!raw) return;
        const value: unknown = JSON.parse(raw);
        if (typeof value === 'object' && value !== null && 'owner' in value && value.owner === accountId) {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
        }
    }));
} catch {
    // Analytics must never prevent loading or saving a note.
}

/** Capture the account/consent epoch before starting an asynchronous mutation. */
export function beginEngagement(userId: string | undefined): Engagement {
    let scope: ReturnType<typeof analytics.beginOperation>;
    let visit: string;
    try {
        scope = analytics.beginOperation();
        visit = analytics.getVisitId();
    } catch {
        return { noteSaved: () => {}, reviewCompleted: () => {}, failed: () => {} };
    }
    const operationKey = `${visit}:${++operationNumber}`;
    let completed = false;

    const run = (work: (state: LocalState) => Promise<void>) => {
        try {
            if (completed || !userId || !scope.enabled || !scope.isCurrent()) return;
            completed = true;
            void enqueue(async () => {
                if (!scope.isCurrent()) return;
                const state = await readState(userId).catch(() => emptyState(userId));
                if (!scope.isCurrent()) return;
                await work(state);
            });
        } catch {
            // Failure to report an action must never turn a saved note into an error.
        }
    };

    return {
        noteSaved(noteId: string, operation: 'new' | 'edit', isFirstStoredNote: () => Promise<boolean>): void {
            run(async (state) => {
                const key = operation === 'new' ? `note-new:${noteId}` : `note-edit:${operationKey}`;
                if (state.keys.includes(key)) return;
                const isFirst = operation === 'new' && !state.savedAny && await isFirstStoredNote().catch(() => false);
                if (!scope.isCurrent()) return;
                const accepted = scope.capture('note_saved', {
                    operation, is_first_note: isFirst, entry_point: operation === 'new' ? 'note_editor' : 'notes',
                }, { dedupeKey: key });
                if (!accepted || !scope.isCurrent()) return;
                const existing = state.notes.find((note) => note.id === noteId);
                remember(state, { id: noteId, reviewed: existing?.reviewed ?? false, savedVisit: existing?.savedVisit ?? visit }, key);
                state.savedAny = true;
                await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
            });
        },
        reviewCompleted(noteId: string, reviewedAt: number, reviewKind: ReviewKind,
            firstStoredReview: () => Promise<{ overall: boolean; forNote: boolean }>): void {
            run(async (state) => {
                const key = `review:${noteId}:${reviewedAt}`;
                if (state.keys.includes(key)) return;
                const first = await firstStoredReview().catch(() => ({ overall: false, forNote: false }));
                if (!scope.isCurrent()) return;
                const note = state.notes.find((entry) => entry.id === noteId);
                const accepted = scope.capture('review_completed', {
                    review_kind: reviewKind,
                    first_review: !state.reviewedAny && first.overall,
                    entry_point: 'notes',
                    is_first_review_for_note: !note?.reviewed && first.forNote,
                    note_saved_on_previous_visit: Boolean(note?.savedVisit && note.savedVisit !== visit),
                }, { dedupeKey: key });
                if (!accepted || !scope.isCurrent()) return;
                remember(state, { id: noteId, ...(note?.savedVisit ? { savedVisit: note.savedVisit } : {}), reviewed: true }, key);
                state.reviewedAny = true;
                await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
            });
        },
        failed(operation: 'note_save' | 'review_save'): void {
            try {
                if (completed || !userId) return;
                completed = true;
                scope.capture('critical_action_failed', { operation, error_code: 'storage' }, { dedupeKey: `failure:${operationKey}` });
            } catch {
                // Preserve the original editor/storage error.
            }
        },
    };
}

/** Called by an intentional list action, never by rendering the reader. */
export function captureNoteOpened(createdAt: number): void {
    try {
        const now = new Date();
        const ageDays = (now.getTime() - createdAt) / 86_400_000;
        const note_age_bucket = new Date(createdAt).toDateString() === now.toDateString()
            ? 'same_day' : ageDays < 8 ? '1_7_days' : ageDays < 31 ? '8_30_days' : 'over_30_days';
        analytics.capture('note_opened', { entry_point: 'notes',
            ...(Number.isFinite(ageDays) && ageDays >= 0 ? { note_age_bucket } : {}) });
    } catch {
        // A reader must open even if analytics is unavailable.
    }
}
