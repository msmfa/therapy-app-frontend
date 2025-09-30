import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
    getTherapySessions,
    createTherapySession,
    updateTherapySession,
    deleteTherapySession,
    TherapySession,
    syncTherapySessions as syncTherapySessionsApi,
} from '../api/therapy';

interface TherapySessionsContextType {
    sessions: TherapySession[];
    loading: boolean;
    error: string | null;
    refreshSessions: () => Promise<void>;
    addSession: (date: Date, duration: number) => Promise<void>;
    syncSessions: (selected: Record<string, Date>, duration: number) => Promise<void>;
    updateSession: (id: string, date: Date, duration: number) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    hasUpcomingSessions: () => boolean;
    nextSession: TherapySession | null;
}

const TherapySessionsContext = createContext<TherapySessionsContextType | undefined>(undefined);

interface TherapySessionsProviderProps {
    children: React.ReactNode;
}

export function TherapySessionsProvider({ children }: TherapySessionsProviderProps) {
    const { token } = useAuth();
    const [sessions, setSessions] = useState<TherapySession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshSessions = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const from = new Date();
            from.setUTCHours(0, 0, 0, 0); // Today at midnight UTC

            const to = new Date();
            to.setFullYear(to.getFullYear() + 1); // One year from today
            to.setUTCHours(23, 59, 59, 999);

            const data = await getTherapySessions(token, from, to);
            setSessions(data);
        } catch (err) {
            setError('Failed to load sessions');
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const addSession = useCallback(
        async (date: Date, duration: number) => {
            if (!token) throw new Error('Not authenticated');

            // Check if session already exists
            const exists = sessions.some(session =>
                new Date(session.startsAtUtc).getTime() === date.getTime()
            );

            if (exists) {
                throw new Error('Session already exists at this time');
            }

            await createTherapySession(token, date, duration);
            await refreshSessions();
        },
        [token, sessions, refreshSessions],
    );

    const syncSessions = useCallback(
        async (selected: Record<string, Date>, duration: number) => {
            if (!token) throw new Error('Not authenticated');

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

            await syncTherapySessionsApi(token, payload);
            await refreshSessions();
        },
        [token, sessions, refreshSessions],
    );

    const updateSession = useCallback(
        async (id: string, date: Date, duration: number) => {
            if (!token) throw new Error('Not authenticated');

            // Check if the new date conflicts with any OTHER session (excluding the one being updated)
            const exists = sessions.some(session =>
                session._id !== id && // Exclude the session being updated
                new Date(session.startsAtUtc).getTime() === date.getTime()
            );

            if (exists) {
                throw new Error('Another session already exists at this time');
            }

            await updateTherapySession(token, id, date, duration);
            await refreshSessions();
        },
        [token, sessions, refreshSessions],
    );

    const deleteSession = useCallback(
        async (id: string) => {
            if (!token) throw new Error('Not authenticated');

            await deleteTherapySession(token, id);
            await refreshSessions();
        },
        [token, refreshSessions],
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
        if (token) {
            refreshSessions();
        } else {
            // Clear all data when user logs out
            setSessions([]);
            setError(null);
            setLoading(false);
        }
    }, [token, refreshSessions]);

    return (
        <TherapySessionsContext.Provider
            value={ {
                sessions,
                loading,
                error,
                refreshSessions,
                addSession,
                syncSessions,
                updateSession,
                deleteSession,
                hasUpcomingSessions,
                nextSession,
            } }
        >
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
