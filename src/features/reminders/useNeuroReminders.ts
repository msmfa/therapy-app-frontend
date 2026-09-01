import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';

import { getReminders } from '../../api/reminders';
import { toError } from '../../utils/errors';
import type { Reminder } from './types';
import {
    clearRemindersCache,
    getLocalDateKey,
    getSessionsSignature,
    isCacheUsable,
    readRemindersCache,
    writeRemindersCache,
} from './remindersCache';

interface SessionLike {
    _id?: string;
    startsAtUtc?: string;
}

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
 * changes, and once a day, since reminders drop out of the schedule as they
 * pass. A failed refresh leaves the last known schedule in place rather than
 * emptying the calendar.
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
): Reminder[] {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    // Guards against a slow response for a stale input overwriting a newer one.
    const requestIdRef = useRef(0);

    const sessionsSignature = useMemo(
        () => getSessionsSignature(sessions),
        [sessions],
    );

    // Paint the last known schedule straight away, before the sessions have
    // even arrived. It is at worst a day stale, and it is the difference
    // between a calendar that opens with its dots and one that flashes empty.
    useEffect(() => {
        if (!isAuthenticated) return undefined;

        let cancelled = false;

        void (async () => {
            const cached = await readRemindersCache();
            if (cancelled || !cached) return;
            // Never clobber a fresher answer that won the race.
            setReminders((current) => (current.length ? current : cached.reminders));
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    const revalidate = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        const cached = await readRemindersCache();

        if (isCacheUsable(cached, sessionsSignature, deviceTimeZone, getLocalDateKey())) {
            if (requestIdRef.current === requestId) {
                setReminders(cached.reminders);
            }
            return;
        }

        try {
            const response = await getReminders();
            if (requestIdRef.current !== requestId) return;

            setReminders(response.reminders);
            await writeRemindersCache({
                reminders: response.reminders,
                timeZone: response.timeZone,
                deviceTimeZone,
                sessionsSignature,
                // Read again rather than reusing an earlier value: the request
                // may have spanned midnight, and stamping the older day would
                // revalidate immediately on the next render.
                localDate: getLocalDateKey(),
            });
        } catch (err) {
            // Non-fatal. The calendar keeps whatever it last knew, and the next
            // foreground or session change tries again.
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'reminders.fetch');
                Sentry.captureException(toError(err));
            });
            console.warn('[Reminders] Failed to load reminder schedule:', err);
        }
    }, [sessionsSignature, deviceTimeZone]);

    useEffect(() => {
        if (!isAuthenticated) {
            requestIdRef.current += 1;
            setReminders([]);
            void clearRemindersCache();
            return;
        }

        if (!sessionsReady) return;

        void revalidate();
    }, [isAuthenticated, sessionsReady, revalidate]);

    return reminders;
}
