import React from 'react';
import { useNotes } from '../../src/hooks/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';

export function NotesScreen() {
	const { notes, loading, refresh } = useNotes();
	console.log('notes', notes);

	// Clean conditional render
	if (notes.length === 0) {
		return <EmptyNotesScreen />;
	}

	console.log('notes', notes);

	return <NotesListScreen notes={notes as any} loading={loading} refresh={refresh} />;
}
