import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { AppState } from 'react-native';
import * as Sentry from '@sentry/react-native';

import { getReminders } from '../../api/reminders';
import { toError } from '../../utils/errors';
import type { Reminder } from './types';
import {
    clearRemindersCache,
    getLocalDateKey,
    getRemindersCacheRevision,
    getSessionsSignature,
    isCacheUsable,
    readRemindersCache,
    writeRemindersCache,
} from './remindersCache';

interface SessionLike {
    _id?: string;
    startsAtUtc?: string;
}

export interface ReminderScheduleSettings {
    timeZone: string;
    morningReminderMinutes: number;
    eveningReminderMinutes: number;
}

export type ReminderScheduleStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * The reminder schedule, fetched from the server and cached on the device.
 *
 * The schedule is computed once, by the same code that sends the pushes, so
 * the calendar can no longer disagree with the notifications the user gets.
 * That makes every read a network read, which is why it is cached: the answer
 * only changes when the user's sessions change, and a cold calendar should not
 * wait on a request to draw dots it already knows about.
 *
 * The cache is revalidated when the sessions change, when the device zone
 * changes, on every return to the foreground, and at local midnight, since
 * reminders drop out of the schedule as they pass. A failed refresh leaves the
 * last known schedule in place rather than emptying the calendar; the next
 * foreground revalidation retries it.
 *
 * `sessionsReady` exists because the sessions are the cache key. Revalidating
 * before they have loaded compares against an empty signature, misses, and
 * spends a request that the very next render invalidates anyway.
 */
export function useNeuroReminders(
    sessions: SessionLike[],
    deviceTimeZone: string,
    isAuthenticated: boolean,
    sessionsReady: boolean,
    refreshSignal = 0,
    onScheduleSettings?: (settings: ReminderScheduleSettings | null) => void,
    onScheduleStatus?: (status: ReminderScheduleStatus) => void,
    accountKey?: string,
): Reminder[] {
    const [snapshot, setSnapshot] = useState<{ owner: string | undefined; reminders: Reminder[] }>(
        () => ({ owner: accountKey, reminders: [] }),
    );
    // Guards against a slow response for a stale input overwriting a newer one.
    const requestIdRef = useRef(0);
    const ownerRef = useRef(accountKey);
    if (ownerRef.current !== accountKey) {
        ownerRef.current = accountKey;
        requestIdRef.current += 1;
    }
    const setReminders = useCallback((update: SetStateAction<Reminder[]>) => {
        if (ownerRef.current !== accountKey) return;
        setSnapshot((current) => ({
            owner: accountKey,
            reminders: typeof update === 'function'
                ? update(current.owner === accountKey ? current.reminders : [])
                : update,
        }));
    }, [accountKey]);

    const sessionsSignature = useMemo(
        () => getSessionsSignature(sessions),
        [sessions],
    );

    // Paint the last known schedule straight away, before the sessions have
    // even arrived. It is at worst a day stale, and it is the difference
    // between a calendar that opens with its dots and one that flashes empty.
    useEffect(() => {
        if (!isAuthenticated) return undefined;

        onScheduleStatus?.('loading');

        let cancelled = false;
        const revision = getRemindersCacheRevision(accountKey);

        void (async () => {
            const cached = await readRemindersCache(accountKey);
            if (cancelled || !cached || revision !== getRemindersCacheRevision(accountKey)) return;
            // Never clobber a fresher answer that won the race.
            setReminders((current) => (current.length ? current : cached.reminders));
            onScheduleSettings?.({
                timeZone: cached.timeZone,
                morningReminderMinutes: cached.morningReminderMinutes,
                eveningReminderMinutes: cached.eveningReminderMinutes,
            });
            onScheduleStatus?.('ready');
        })();

        return () => {
            cancelled = true;
        };
    }, [accountKey, isAuthenticated, onScheduleSettings, onScheduleStatus, setReminders]);

    const revalidate = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        const revision = getRemindersCacheRevision(accountKey);
        const isCurrent = () => requestIdRef.current === requestId
            && revision === getRemindersCacheRevision(accountKey);

        const cached = await readRemindersCache(accountKey);
        if (!isCurrent()) return;

        if (isCacheUsable(cached, sessionsSignature, deviceTimeZone, getLocalDateKey())) {
            if (isCurrent()) {
                setReminders(cached.reminders);
                onScheduleSettings?.({
                    timeZone: cached.timeZone,
                    morningReminderMinutes: cached.morningReminderMinutes,
                    eveningReminderMinutes: cached.eveningReminderMinutes,
                });
                onScheduleStatus?.('ready');
            }
            return;
        }

        onScheduleStatus?.('loading');

        try {
            const response = await getReminders();
            if (!isCurrent()) return;

            setReminders(response.reminders);
            onScheduleSettings?.({
                timeZone: response.timeZone,
                morningReminderMinutes: response.morningReminderMinutes,
                eveningReminderMinutes: response.eveningReminderMinutes,
            });
            onScheduleStatus?.('ready');
            await writeRemindersCache({
                reminders: response.reminders,
                timeZone: response.timeZone,
                morningReminderMinutes: response.morningReminderMinutes,
                eveningReminderMinutes: response.eveningReminderMinutes,
                deviceTimeZone,
                sessionsSignature,
                // Read again rather than reusing an earlier value: the request
                // may have spanned midnight, and stamping the older day would
                // revalidate immediately on the next render.
                localDate: getLocalDateKey(),
            }, accountKey, revision);
        } catch (err) {
            if (!isCurrent()) return;
            // Non-fatal. The calendar keeps whatever it last knew, and the next
            // foreground or session change tries again.
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'reminders.fetch');
                Sentry.captureException(toError(err));
            });
            console.warn('[Reminders] Failed to load reminder schedule:', err);
            onScheduleStatus?.('error');
        }
    }, [accountKey, sessionsSignature, deviceTimeZone, onScheduleSettings, onScheduleStatus, setReminders]);

    useEffect(() => {
        if (!isAuthenticated) {
            requestIdRef.current += 1;
            setReminders([]);
            onScheduleSettings?.(null);
            onScheduleStatus?.('idle');
            void clearRemindersCache();
            return;
        }

        if (!sessionsReady) {
            onScheduleStatus?.('loading');
            return;
        }

        void revalidate();
    }, [isAuthenticated, sessionsReady, refreshSignal, revalidate, onScheduleStatus, onScheduleSettings, setReminders]);

    // The effect above only re-runs when its inputs change, and neither a
    // failed fetch nor the local day rolling over changes any of them. Two
    // triggers cover those: returning to the foreground (which retries a
    // failed fetch and catches any midnights that passed while backgrounded),
    // and a timer for the midnight that passes while the app stays open.
    // Revalidation is cheap when the cache is still usable, so firing these on
    // a healthy cache costs a storage read, not a request.
    useEffect(() => {
        if (!isAuthenticated || !sessionsReady) return undefined;

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void revalidate();
        });

        let midnightTimer: ReturnType<typeof setTimeout>;
        const armMidnightTimer = () => {
            const now = new Date();
            const justPastMidnight = new Date(now);
            // A few seconds past, so the new local day key has definitely begun.
            justPastMidnight.setHours(24, 0, 5, 0);

            midnightTimer = setTimeout(() => {
                void revalidate();
                armMidnightTimer();
            }, justPastMidnight.getTime() - now.getTime());
        };
        armMidnightTimer();

        return () => {
            subscription.remove();
            clearTimeout(midnightTimer);
        };
    }, [isAuthenticated, sessionsReady, revalidate]);

    return isAuthenticated && snapshot.owner === accountKey ? snapshot.reminders : [];
}
