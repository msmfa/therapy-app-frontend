import React from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes } from '../../src/features/notes/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import Loading from '../../src/components/ui/Loading';

export default function NotesScreen() {
    const { user } = useAuth();
    const { notes, loading, refresh, updateNote } = useNotes(user?.id);

    const handleUpdateNote = React.useCallback(
        async (noteId: string, text: string) => {
            await updateNote(noteId, { text });
        },
        [updateNote],
    );

    useFocusEffect(
        React.useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    if (!user?.id) {
        return <Loading />;
    }

    if (notes.length === 0) {
        return <EmptyNotesScreen />;
    }

    return (
        <NotesListScreen
            notes={ notes }
            loading={ loading }
            refresh={ refresh }
            onUpdateNote={ handleUpdateNote }
        />
    );
}
