import React from 'react';
import { useNotes } from '../../src/hooks/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import { useAuth } from '../../src/auth/AuthContext';

export default function NotesScreen() {
    const { user } = useAuth();
    const { notes, loading, refresh } = useNotes(user?.id);

    if (notes.length === 0) {
        return <EmptyNotesScreen />;
    }

    return <NotesListScreen notes={ notes } loading={ loading } refresh={ refresh } />;
}
