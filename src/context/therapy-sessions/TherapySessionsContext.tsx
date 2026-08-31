import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import {
    getTherapySessions,
    TherapySession,
    toUtcDayRange,
    syncTherapySessions as syncTherapySessionsApi,
} from '../../api/therapy';
import { scheduleNeuroplasticityReminders, Reminder } from '../../features/reminders/reminder-schedule-v2';
import { useDeviceTimeZone } from '../../hooks/useDeviceTimeZone';
import { mapSessionError, SessionErrorCopy } from '../../features/therapy-sessions/session-error-map';
import { toError } from '../../utils/errors';

interface TherapySessionsContextType {
    sessions: TherapySession[];
    loading: boolean;
    error: SessionErrorCopy | null;
    nextSession: TherapySession | null;
    neuroReminders: Reminder[];
    refreshSessions: () => Promise<void>;
    syncSessions: (selected: Record<string, Date>, duration: number) => Promise<void>;
}

const TherapySessionsContext = createContext<TherapySessionsContextType | undefined>(undefined);

/**
 * Assumed length of a session whose duration was never recorded.
 *
 * `durationMin` is optional on the API, so a session can arrive without one.
 * Treating that as zero-length left the reminder plan with no session end to
 * stay clear of, and showed reminders landing inside the session. 50 is what
 * both write paths send, so an unknown session is assumed to look like every
 * session the app itself creates.
 *
 * Mirrors DEFAULT_SESSION_MINUTES in the backend's notificationCron.helpers.ts:
 * the two have to agree or the plan shown here drifts from the pushes sent.
 */
const DEFAULT_SESSION_MINUTES = 50;

const effectiveDurationMin = (durationMin?: number | null): number =>
    typeof durationMin === 'number' && Number.isFinite(durationMin) && durationMin > 0
        ? durationMin
        : DEFAULT_SESSION_MINUTES;

/**
 * The window of sessions the app fetches and edits: from the start of the
 * user's local day one year ahead. The floor is local midnight, not UTC
 * midnight: with a UTC floor, a session earlier today disappeared from the
 * calendar every evening for anyone west of UTC (and every morning east of
 * it), and anything that falls out of this window is also excluded from the
 * sync's deletion scope, so it silently became undeletable dead weight.
 * The same window is passed to syncSessions so the backend only deletes
 * within what the user could actually see.
 */
const getSessionsWindow = () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date();
    to.setFullYear(to.getFullYear() + 1);
    to.setHours(23, 59, 59, 999);

    return { from, to };
};

/**
 * The window the app *reads*, which reaches back a year before the editable
 * window starts.
 *
 * Reminders are derived from the gap between two consecutive sessions, so the
 * reminders still owed between the last session and the next one can only be
 * computed if that already-past session is in hand. Fetching from today
 * onwards dropped it, the current gap ceased to exist as far as the client was
 * concerned, and every remaining reminder in it vanished from the calendar the
 * day after each session, while the cron — which reads every session the user
 * has — went on sending those same pushes. The calendar disagreed with the
 * notifications the user actually received.
 *
 * Only the read widens. The editable set and the window handed to syncSessions
 * are unchanged, so the sync's deletion scope still cannot exceed what the user
 * could see and past sessions stay untouchable.
 */
const SESSIONS_LOOKBACK_YEARS = 1;

const getSessionsFetchWindow = () => {
    const { from, to } = getSessionsWindow();

    const fetchFrom = new Date(from);
    fetchFrom.setFullYear(fetchFrom.getFullYear() - SESSIONS_LOOKBACK_YEARS);

    return { from: fetchFrom, to };
};

interface TherapySessionsProviderProps {
    children: React.ReactNode;
}

export function TherapySessionsProvider({ children }: TherapySessionsProviderProps) {
    const { isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<TherapySession[]>([]);
    // Everything the read window returned, including sessions before today.
    // Only the reminder schedule uses these; the calendar edits `sessions`.
    const [reminderSessions, setReminderSessions] = useState<TherapySession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<SessionErrorCopy | null>(null);
    const [neuroReminders, setNeuroReminders] = useState<Reminder[]>([]);
    const deviceTimeZone = useDeviceTimeZone();
    const refreshInFlightRef = useRef<Promise<void> | null>(null);
    const sessionsCountRef = useRef(0);

    useEffect(() => {
        sessionsCountRef.current = sessions.length;
    }, [sessions.length]);

    const refreshSessions = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        if (refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const request = (async () => {
            setLoading(true);
            try {
                setError(null);
                const { from, to } = getSessionsWindow();
                const fetchWindow = getSessionsFetchWindow();

                const data = await getTherapySessions(fetchWindow.from, fetchWindow.to);

                // The editable set stays exactly what it was before the read
                // widened: the same floor `getTherapySessions` would have
                // applied to the un-widened window.
                const { fromUTC } = toUtcDayRange(from, to);
                setReminderSessions(data);
                setSessions(
                    data.filter(
                        (session) =>
                            new Date(session.startsAtUtc).getTime() >= fromUTC.getTime(),
                    ),
                );
            } catch (err) {
                const mapped = mapSessionError(err);
                setError({ ...mapped });
                const shouldReport = !(err instanceof ApiError) || err.status >= 500;
                if (shouldReport) {
                    Sentry.withScope((scope) => {
                        scope.setTag('feature', 'therapy-sessions.refreshSessions');
                        scope.setContext('request', {
                            cachedSessions: sessionsCountRef.current,
                        });
                        Sentry.captureException(toError(err));
                    });
                }
                console.error('Error loading sessions:', err);
            } finally {
                refreshInFlightRef.current = null;
                setLoading(false);
            }
        })();

        refreshInFlightRef.current = request;
        return request;
    }, [isAuthenticated]);

    const syncSessions = useCallback(
        async (selected: Record<string, Date>, duration: number) => {
            if (!isAuthenticated) {
                throw new Error('Not authenticated');
            }

            const payload = Object.values(selected).map((date) => {
                const existing = sessions.find(
                    (session) => new Date(session.startsAtUtc).getTime() === date.getTime(),
                );

                return {
                    id: existing?._id,
                    startsAtUtc: date.toISOString(),
                    durationMin: existing?.durationMin ?? duration,
                };
            });

            await syncTherapySessionsApi(payload, getSessionsWindow());
            await refreshSessions();
        },
        [isAuthenticated, sessions, refreshSessions],
    );

    const nextSession = useMemo(() => {
        const now = Date.now();
        let earliest: TherapySession | null = null;
        let earliestStart = Number.POSITIVE_INFINITY;

        sessions.forEach((session) => {
            const start = new Date(session.startsAtUtc).getTime();
            if (start > now && start < earliestStart) {
                earliest = session;
                earliestStart = start;
            }
        });

        return earliest;
    }, [sessions]);

    useEffect(() => {
        if (!reminderSessions.length) {
            setNeuroReminders([]);
            return;
        }

        // Scheduled from the read window rather than the editable one: the
        // reminders still owed before the next session belong to the gap that
        // opens at the *previous* session, which is already in the past.
        const sessionsUtc = reminderSessions
            .map((session) => session.startsAtUtc)
            .filter((value): value is string => typeof value === 'string');

        // Durations travel alongside the starts so the plan shown here never
        // promises a reminder while a session is still running, matching what
        // the backend cron will actually send.
        const sessionDurationsMin: Record<string, number> = {};
        for (const session of reminderSessions) {
            if (typeof session.startsAtUtc === 'string') {
                sessionDurationsMin[session.startsAtUtc] = effectiveDurationMin(session.durationMin);
            }
        }

        const reminders = scheduleNeuroplasticityReminders({
            nowUtc: new Date().toISOString(),
            sessionsUtc,
            reflectionHour: 20,
            morningHour: 7,
            startAfterDays: 3,
            cadenceDays: 4,
            timeZone: deviceTimeZone,
            sessionDurationsMin,
        });

        setNeuroReminders(reminders);
        // deviceTimeZone is a dependency because reminder instants are derived
        // from it. Travelling does not change the user's sessions, so keying
        // this only on [sessions] left the UI showing times computed for the
        // previous zone while useTimeZoneSync had already moved the backend to
        // the new one.
    }, [reminderSessions, deviceTimeZone]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshSessions();
        } else {
            setSessions([]);
            setReminderSessions([]);
            setError(null);
            setLoading(false);
            setNeuroReminders([]);
        }
    }, [isAuthenticated, refreshSessions]);

    const value: TherapySessionsContextType = {
        sessions,
        loading,
        error,
        nextSession,
        neuroReminders,
        refreshSessions,
        syncSessions,
    };

    return (
        <TherapySessionsContext.Provider value={ value }>
            { children }
        </TherapySessionsContext.Provider>
    );
}

export function useTherapySessions() {
    const context = useContext(TherapySessionsContext);
    if (!context) {
        throw new Error('useTherapySessions must be used within TherapySessionsProvider');
    }
    return context;
}
