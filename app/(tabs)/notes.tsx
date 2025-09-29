import React from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useNotes } from '../../src/hooks/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';

export default function NotesScreen() {
    const { user } = useAuth();
    const { notes, loading, refresh } = useNotes(user?.id);

    useFocusEffect(
        React.useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    if (!user?.id) return null;

    if (notes.length === 0) {
        return <EmptyNotesScreen />;
    }

    return <NotesListScreen notes={ notes } loading={ loading } refresh={ refresh } />;
}
