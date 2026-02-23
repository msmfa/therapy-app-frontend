import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    cancelAddNoteReminderNotifications,
} from '../../../services/notifications/add-note-reminder';

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

export async function clearAddNoteReminders(): Promise<void> {
    const previous = await loadStoredAddReminders();
    if (previous.length) {
        await cancelAddNoteReminderNotifications(previous.map((item) => item.id));
    }

    await persistStoredAddReminders([]);
}
