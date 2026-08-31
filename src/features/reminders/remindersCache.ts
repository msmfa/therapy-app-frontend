import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Reminder } from './types';

/**
 * Versioned so a change to the entry shape retires old entries rather than
 * being parsed into something half-valid.
 */
const CACHE_KEY = 'neuroReminders:v1';

export interface CachedReminders {
    reminders: Reminder[];
    /** The zone the server resolved the schedule in. */
    timeZone: string;
    /**
     * The device zone when the entry was written, which is what travel
     * actually changes. Compared against the live device zone rather than
     * `timeZone`, because the server legitimately answers in UTC for a profile
     * whose zone has not synced yet, and treating that as a mismatch would
     * refetch on every launch.
     */
    deviceTimeZone: string;
    /** Identity of the sessions the schedule was computed from. */
    sessionsSignature: string;
    /** Device-local day the entry was written on, as YYYY-MM-DD. */
    localDate: string;
}

/**
 * Identity of a set of sessions, for deciding whether a cached schedule is
 * still describing the same input.
 *
 * Start times are included, not just ids: moving a session keeps its id and is
 * exactly the edit that must invalidate the cache.
 */
export const getSessionsSignature = (
    sessions: Array<{ _id?: string; startsAtUtc?: string }>,
): string =>
    sessions
        .map((session) => `${session._id ?? 'new'}@${session.startsAtUtc ?? 'unknown'}`)
        .sort()
        .join('|');

/** The device's local day, as YYYY-MM-DD. */
export const getLocalDateKey = (now: Date = new Date()): string => {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const readRemindersCache = async (): Promise<CachedReminders | null> => {
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<CachedReminders>;
        // A truncated or hand-edited entry must read as "no cache" rather than
        // becoming a schedule with undefined fields.
        if (
            !Array.isArray(parsed.reminders)
            || typeof parsed.timeZone !== 'string'
            || typeof parsed.deviceTimeZone !== 'string'
            || typeof parsed.sessionsSignature !== 'string'
            || typeof parsed.localDate !== 'string'
        ) {
            return null;
        }

        return parsed as CachedReminders;
    } catch {
        return null;
    }
};

export const writeRemindersCache = async (entry: CachedReminders): Promise<void> => {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
        // A cache that cannot be written is a slower app, not a broken one.
    }
};

export const clearRemindersCache = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
        // Nothing useful to do; the entry is invalidated by signature anyway.
    }
};

/**
 * Whether a cached schedule can still be shown without asking the server.
 *
 * Reminders only move when the sessions move, so the signature carries most of
 * the work. The day check is what stops a schedule going stale simply by
 * sitting still: reminders drop out of it as they pass.
 */
export const isCacheUsable = (
    cached: CachedReminders | null,
    sessionsSignature: string,
    deviceTimeZone: string,
    localDate: string,
): cached is CachedReminders =>
    cached !== null
    && cached.sessionsSignature === sessionsSignature
    && cached.deviceTimeZone === deviceTimeZone
    && cached.localDate === localDate;
