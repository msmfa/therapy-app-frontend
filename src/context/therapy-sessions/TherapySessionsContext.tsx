import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import {
    getTherapySessions,
    TherapySession,
    syncTherapySessions as syncTherapySessionsApi,
} from '../../api/therapy';
import type { Reminder } from '../../features/reminders/types';
import { useNeuroReminders } from '../../features/reminders/useNeuroReminders';
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

interface TherapySessionsProviderProps {
    children: React.ReactNode;
}

export function TherapySessionsProvider({ children }: TherapySessionsProviderProps) {
    const { isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<TherapySession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<SessionErrorCopy | null>(null);
    // Whether the sessions have been fetched at least once. The reminder
    // cache is keyed on them, so revalidating before they land would miss on
    // an empty signature and spend a request the next render invalidates.
    const [sessionsReady, setSessionsReady] = useState(false);
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

                const data = await getTherapySessions(from, to);
                setSessions(data);
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
                setSessionsReady(true);
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

    // Fetched from the server rather than computed here, so the plan shown to
    // the user is the plan the cron will send. deviceTimeZone is passed in
    // because travelling has to invalidate the cached schedule: the sessions
    // are unchanged, but the wall-clock times they resolve to are not.
    const neuroReminders = useNeuroReminders(
        sessions,
        deviceTimeZone,
        isAuthenticated,
        sessionsReady,
    );

    useEffect(() => {
        if (isAuthenticated) {
            refreshSessions();
        } else {
            setSessions([]);
            setError(null);
            setLoading(false);
            setSessionsReady(false);
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
