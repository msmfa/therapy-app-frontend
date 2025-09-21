import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnFocus } from './useOnFocus';

export type Note = { id: string; text: string; createdAt: number };

const DEFAULT_KEY = '@session_notes_v1';

function normalize(raw: any[]): Note[] {
	return (raw || [])
		.map((n) => ({
			id: String(n.id),
			text: n.text,
			createdAt: Number(n.createdAt),
		}))
		.sort((a, b) => b.createdAt - a.createdAt);
}

export function useNotes(storageKey: string = DEFAULT_KEY) {
	const [notes, setNotes] = React.useState<Note[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);

	const refresh = React.useCallback(async () => {
		try {
			setLoading(true);
			const raw = await AsyncStorage.getItem(storageKey);
			const parsed = raw ? JSON.parse(raw) : [];
			setNotes(normalize(parsed));
			setError(null);
		} catch (e: any) {
			setError('Failed to load notes');
			console.warn(e);
		} finally {
			setLoading(false);
		}
	}, [storageKey]);

	// initial load
	React.useEffect(() => {
		refresh();
	}, [refresh]);

	// reload whenever this screen regains focus
	useOnFocus(() => {
		refresh();
	}, [refresh]);

	const persist = React.useCallback(
		async (updater: (prev: Note[]) => Note[]) => {
			setNotes((prev) => {
				const next = updater(prev);
				AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(console.warn);
				return next;
			});
		},
		[storageKey],
	);

	const addNote = React.useCallback(
		async (text: string) => {
			const clean = text.trim();
			if (!clean) return;
			const now = Date.now();
			await persist((prev) => [{ id: String(now), text: clean, createdAt: now }, ...prev]);
		},
		[persist],
	);

	const deleteNote = React.useCallback(
		async (id: string) => {
			await persist((prev) => prev.filter((n) => n.id !== id));
		},
		[persist],
	);

	return { notes, loading, error, refresh, addNote, deleteNote };
}
