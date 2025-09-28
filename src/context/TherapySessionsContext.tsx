import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
            from.setHours(0, 0, 0, 0); // Today at midnight

            const to = new Date();
            to.setFullYear(to.getFullYear() + 1); // One year from today
            to.setHours(23, 59, 59, 999);

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
                console.log("Session already exists at this time");
                return; // Or show an alert
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
                console.error('Time Conflict: Another session already exists at this time');
                return;
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
        const now = new Date();
        return sessions.some((session) => new Date(session.startsAtUtc) > now);
    }, [sessions]);

    useEffect(() => {
        if (token) {
            refreshSessions();
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
