import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import {
    getTherapySessions,
    createTherapySession,
    updateTherapySession,
    deleteTherapySession,
    TherapySession,
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
    addSession: (date: Date, duration: number) => Promise<void>;
    syncSessions: (selected: Record<string, Date>, duration: number) => Promise<void>;
    updateSession: (id: string, date: Date, duration: number) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    hasUpcomingSessions: () => boolean;
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
            }
        })();

        refreshInFlightRef.current = request;
        return request;
    }, [isAuthenticated]);

    const addSession = useCallback(
        async (date: Date, duration: number) => {
            if (!isAuthenticated) {
                throw new Error('Not authenticated');
            }

            const exists = sessions.some((session) =>
                new Date(session.startsAtUtc).getTime() === date.getTime(),
            );

            if (exists) {
                throw new Error('Session already exists at this time');
            }

            await createTherapySession(date, duration);
            await refreshSessions();
        },
        [isAuthenticated, sessions, refreshSessions],
    );

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

    const updateSession = useCallback(
        async (id: string, date: Date, duration: number) => {
            if (!isAuthenticated) {
                throw new Error('Not authenticated');
            }

            const exists = sessions.some((session) =>
                session._id !== id &&
                new Date(session.startsAtUtc).getTime() === date.getTime(),
            );

            if (exists) {
                throw new Error('Another session already exists at this time');
            }

            await updateTherapySession(id, date, duration);
            await refreshSessions();
        },
        [isAuthenticated, sessions, refreshSessions],
    );

    const deleteSession = useCallback(
        async (id: string) => {
            if (!isAuthenticated) {
                throw new Error('Not authenticated');
            }

            await deleteTherapySession(id);
            await refreshSessions();
        },
        [isAuthenticated, refreshSessions],
    );

    const hasUpcomingSessions = useCallback(() => {
        const now = Date.now();
        return sessions.some((session) => new Date(session.startsAtUtc).getTime() > now);
    }, [sessions]);

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
        if (!sessions.length) {
            setNeuroReminders([]);
            return;
        }

        const sessionsUtc = sessions
            .map((session) => session.startsAtUtc)
            .filter((value): value is string => typeof value === 'string');

        const reminders = scheduleNeuroplasticityReminders({
            nowUtc: new Date().toISOString(),
            sessionsUtc,
            reflectionHour: 20,
            morningHour: 7,
            startAfterDays: 3,
            cadenceDays: 4,
            timeZone: deviceTimeZone,
        });

        setNeuroReminders(reminders);
        // deviceTimeZone is a dependency because reminder instants are derived
        // from it. Travelling does not change the user's sessions, so keying
        // this only on [sessions] left the UI showing times computed for the
        // previous zone while useTimeZoneSync had already moved the backend to
        // the new one.
    }, [sessions, deviceTimeZone]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshSessions();
        } else {
            setSessions([]);
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
        addSession,
        syncSessions,
        updateSession,
        deleteSession,
        hasUpcomingSessions,
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
