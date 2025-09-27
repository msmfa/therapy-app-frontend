import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
	getTherapySessions,
	createTherapySession,
	updateTherapySession,
	deleteTherapySession,
	TherapySession,
} from '../api/therapy';

interface TherapySessionsContextType {
	sessions: TherapySession[];
	loading: boolean;
	error: string | null;
	refreshSessions: () => Promise<void>;
	addSession: (date: Date, duration: number) => Promise<void>;
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
			from.setMonth(from.getMonth() - 3);
			const to = new Date();
			to.setMonth(to.getMonth() + 3);

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

			await createTherapySession(token, date, duration);
			await refreshSessions();
		},
		[token, refreshSessions],
	);

	const updateSession = useCallback(
		async (id: string, date: Date, duration: number) => {
			if (!token) throw new Error('Not authenticated');

			await updateTherapySession(token, id, date, duration);
			await refreshSessions();
		},
		[token, refreshSessions],
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
			value={{
				sessions,
				loading,
				error,
				refreshSessions,
				addSession,
				updateSession,
				deleteSession,
				hasUpcomingSessions,
			}}
		>
			{children}
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
