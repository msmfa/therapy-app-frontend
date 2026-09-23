import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CalendarSnapshot } from '../../api/therapy';

/**
 * The last calendar the server answered with, kept on the device per account.
 *
 * It exists for one reason: a cold start paints the month with its sessions
 * and dots straight away instead of flashing empty while the request is in
 * flight. It is never trusted over the server. Every mount fetches, and the
 * fetched answer replaces it. There is no revision bookkeeping here because
 * the snapshot carries the server's own `revision`, and a newer one wins.
 *
 * Versioned so a change to the snapshot shape retires old entries rather than
 * being parsed into something half valid.
 */
const keyFor = (userId: string) => `calendarSnapshot:v1:${encodeURIComponent(userId)}`;

const isSnapshot = (value: unknown): value is CalendarSnapshot => {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<CalendarSnapshot>;
    return typeof candidate.revision === 'number'
        && typeof candidate.timeZone === 'string'
        && typeof candidate.morningReminderMinutes === 'number'
        && typeof candidate.eveningReminderMinutes === 'number'
        && Array.isArray(candidate.sessions)
        && Array.isArray(candidate.series)
        && Array.isArray(candidate.reminders);
};

export const readCalendarSnapshot = async (userId: string): Promise<CalendarSnapshot | null> => {
    try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isSnapshot(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

export const writeCalendarSnapshot = async (userId: string, snapshot: CalendarSnapshot): Promise<void> => {
    try {
        await AsyncStorage.setItem(keyFor(userId), JSON.stringify(snapshot));
    } catch {
        // A snapshot that fails to persist costs one empty flash on the next
        // cold start and nothing else.
    }
};

export const clearCalendarSnapshot = async (userId: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(keyFor(userId));
    } catch {
        // Nothing to do: the entry is validated on read and replaced on fetch.
    }
};
