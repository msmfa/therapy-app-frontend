import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { getPostSessionNoteReminders } from '../reminder-schedule-v2';
import type { TherapySession } from '../../../api/therapy';
import {
    scheduleAddNoteReminderNotification,
    cancelAddNoteReminderNotifications,
} from '../../../services/notifications/add-note-reminder';
import { toError } from '../../../utils/errors';

const STORAGE_KEY = 'add.note.reminders';

interface StoredAddReminder {
    id: string;
    remindAtUtc: string;
}

function isStoredAddReminder(value: unknown): value is StoredAddReminder {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<StoredAddReminder>;
    return typeof candidate.id === 'string' && typeof candidate.remindAtUtc === 'string';
}

async function loadStoredAddReminders(): Promise<StoredAddReminder[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        const parsedArray: unknown[] = Array.isArray(parsed) ? parsed : [];
        return parsedArray.filter(isStoredAddReminder);
    } catch (err) {
        console.warn('[add-note-reminder] failed to read storage', err);
        return [];
    }
}

async function persistStoredAddReminders(entries: StoredAddReminder[]): Promise<void> {
    try {
        if (!entries.length) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            return;
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
        console.warn('[add-note-reminder] failed to persist storage', err);
    }
}

/**
 * Schedule notifications to remind users to write session notes after therapy.
 */
export async function scheduleAddNoteReminders(
    noteId: string,
    message: string,
    sessions: Array<Pick<TherapySession, '_id' | 'startsAtUtc' | 'durationMin'>>,
    minutesAfterSession = 10,
): Promise<void> {
    await clearAddNoteReminders();

    const plan = getPostSessionNoteReminders({
        sessions,
        nowUtc: new Date().toISOString(),
        minutesAfterSession,
    });

    if (!plan.length) {
        await persistStoredAddReminders([]);
        return;
    }

    const scheduled: StoredAddReminder[] = [];

    for (const { remindAtUtc } of plan) {
        const when = new Date(remindAtUtc);
        if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
            continue;
        }

        try {
            const id = await scheduleAddNoteReminderNotification(noteId, message, when);
            scheduled.push({ id, remindAtUtc });
        } catch (err) {
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'reminders.add.schedule');
                scope.setContext('reminder', { noteId, remindAtUtc });
                Sentry.captureException(toError(err));
            });
            console.warn('[add-note-reminder] schedule failed', remindAtUtc, err);
        }
    }

    await persistStoredAddReminders(scheduled);
}

export async function clearAddNoteReminders(): Promise<void> {
    const previous = await loadStoredAddReminders();
    if (previous.length) {
        await cancelAddNoteReminderNotifications(previous.map((item) => item.id));
    }

    await persistStoredAddReminders([]);
}
