import React from 'react';
import { useNotes } from '../../src/hooks/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';

export default function NotesScreen() {
    const { notes, loading, refresh } = useNotes();

    console.log("NotesScreen render:", notes, "loading:", loading);

    // Clean conditional render
    if (notes.length === 0) {
        return <EmptyNotesScreen />;
    }

    return <NotesListScreen notes={ notes } loading={ loading } refresh={ refresh } />;
}
