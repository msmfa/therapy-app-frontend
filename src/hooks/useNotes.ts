import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleNoteReminder, cancelReminder } from '../utils/schedule-reminders';

type Note = {
	id: string;
	text: string;
	createdAt: number;
	remindAt?: number; // epoch ms
	notifId?: string; // Expo notification id
};

const STORAGE_KEY = '@session_notes_v1';

export function useNotes(storageKey: string = STORAGE_KEY) {
	const [notes, setNotes] = React.useState<Note[]>([]);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [error, setError] = React.useState<string | null>(null);

	const refresh = React.useCallback(async () => {
		try {
			setLoading(true);
			const raw = await AsyncStorage.getItem(storageKey);
			const parsed: Note[] = raw ? JSON.parse(raw) : [];
			parsed.sort((a, b) => b.createdAt - a.createdAt);
			setNotes(parsed);
			setError(null);
		} catch (e) {
			console.warn('useNotes.refresh', e);
			setError('Failed to load notes');
			setNotes([]);
		} finally {
			setLoading(false);
		}
	}, [storageKey]);

	React.useEffect(() => {
		refresh();
	}, [refresh]);

	const persist = React.useCallback(
		(updater: (prev: Note[]) => Note[]) => {
			setNotes((prev) => {
				const next = updater(prev);
				next.sort((a, b) => b.createdAt - a.createdAt);
				AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch((err) =>
					console.warn('useNotes.persist', err),
				);
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
			persist((prev) => [{ id: String(now), text: clean, createdAt: now }, ...prev]);
		},
		[persist],
	);

	const addNoteWithReminder = React.useCallback(
		async (text: string, when?: Date) => {
			const clean = text.trim();
			if (!clean) return;
			const now = Date.now();
			let notifId: string | undefined;
			let remindAt: number | undefined;

			if (when) {
				notifId = await scheduleNoteReminder(String(now), clean, when);
				remindAt = when.getTime();
			}

			persist((prev) => [
				{ id: String(now), text: clean, createdAt: now, remindAt, notifId },
				...prev,
			]);
		},
		[persist],
	);

	const updateNote = React.useCallback(
		async (id: string, patch: Partial<Pick<Note, 'text' | 'remindAt' | 'notifId'>>) => {
			persist((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
		},
		[persist],
	);

	const deleteNote = React.useCallback(
		async (id: string) => {
			setNotes((prev) => {
				const target = prev.find((n) => n.id === id);
				if (target?.notifId) {
					cancelReminder(target.notifId).catch(() => {});
				}
				const next = prev.filter((n) => n.id !== id);
				next.sort((a, b) => b.createdAt - a.createdAt);
				AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch((err) =>
					console.warn('useNotes.deleteNote', err),
				);
				return next;
			});
		},
		[storageKey],
	);

	const setReminder = React.useCallback(
		async (id: string, when: Date) => {
			if (when.getTime() <= Date.now()) throw new Error('Pick a future date & time');
			const current = notes.find((n) => n.id === id);
			if (!current) throw new Error('Note not found');

			if (current.notifId) {
				try {
					await cancelReminder(current.notifId);
				} catch {}
			}

			const notifId = await scheduleNoteReminder(id, current.text, when);
			const remindAt = when.getTime();

			persist((prev) => prev.map((n) => (n.id === id ? { ...n, remindAt, notifId } : n)));
		},
		[notes, persist],
	);

	const removeReminder = React.useCallback(
		async (id: string) => {
			const current = notes.find((n) => n.id === id);
			if (current?.notifId) {
				try {
					await cancelReminder(current.notifId);
				} catch {}
			}
			persist((prev) =>
				prev.map((n) =>
					n.id === id ? { ...n, remindAt: undefined, notifId: undefined } : n,
				),
			);
		},
		[notes, persist],
	);

	const clearAll = React.useCallback(async () => {
		for (const n of notes) {
			if (n.notifId) {
				try {
					await cancelReminder(n.notifId);
				} catch {}
			}
		}
		await AsyncStorage.removeItem(storageKey).catch(() => {});
		setNotes([]);
	}, [notes, storageKey]);

	return {
		notes,
		loading,
		error,
		refresh,
		addNote,
		addNoteWithReminder,
		updateNote,
		deleteNote,
		setReminder,
		removeReminder,
		clearAll,
	};
}
