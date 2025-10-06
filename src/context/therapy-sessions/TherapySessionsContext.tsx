import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
import { scheduleTherapySessionNotifications } from '../../utils/schedule-reminders';
import { scheduleNeuroplasticityReminders, Reminder } from '../../components/reminders/reminder-schedule-v2';

const POST_SESSION_NOTIFICATION_ID = 'post-session-note';
const POST_SESSION_NOTIFICATION_MESSAGE = 'Remember to take a note about your therapy session';

interface TherapySessionsContextType {
    sessions: TherapySession[];
    loading: boolean;
    error: string | null;
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

interface TherapySessionsProviderProps {
    children: React.ReactNode;
}

export function TherapySessionsProvider({ children }: TherapySessionsProviderProps) {
    const { isAuthenticated } = useAuth();
    const [sessions, setSessions] = useState<TherapySession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [neuroReminders, setNeuroReminders] = useState<Reminder[]>([]);

    const refreshSessions = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const from = new Date();
            from.setUTCHours(0, 0, 0, 0);

            const to = new Date();
            to.setFullYear(to.getFullYear() + 1);
            to.setUTCHours(23, 59, 59, 999);

            const data = await getTherapySessions(from, to);
            setSessions(data);

            try {
                await scheduleTherapySessionNotifications(
                    POST_SESSION_NOTIFICATION_ID,
                    POST_SESSION_NOTIFICATION_MESSAGE,
                    data,
                );
            } catch (notificationError) {
                console.warn('[TherapySessions] scheduling notifications failed:', notificationError);
            }
        } catch (err) {
            const message = err instanceof ApiError
                ? err.message
                : err instanceof Error
                    ? err.message
                    : undefined;
            setError(message ?? 'Failed to load sessions');
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
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

            await syncTherapySessionsApi(payload);
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
        });

        setNeuroReminders(reminders);
    }, [sessions]);

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
