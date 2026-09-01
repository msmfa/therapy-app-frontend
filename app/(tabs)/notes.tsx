import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes, type Note } from '../../src/features/notes/useNotes';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import Loading from '../../src/components/ui/Loading';
import { useAppAlert } from '../../src/context/alert';
import { useNoteReviews } from '../../src/features/reviews';
import { GRADIENTS } from 'designs/designs-gradients';

export default function NotesScreen() {
    const { user } = useAuth();
    const { notes, loading, error, refresh, updateNote } = useNotes(user?.id);
    const { progressFor, reviewState, markReviewed } = useNoteReviews(user?.id);
    const { showAlert } = useAppAlert();

    const canReview = React.useCallback(
        (note: Note) => reviewState(note).canReview,
        [reviewState],
    );

    const handleReviewed = React.useCallback(
        async (note: Note) => {
            await markReviewed(note);
        },
        [markReviewed],
    );

    const handleUpdateNote = React.useCallback(
        async (noteId: string, text: string) => {
            await updateNote(noteId, { text });
        },
        [updateNote],
    );

    useFocusEffect(
        React.useCallback(() => {
            void refresh({ silent: true });
        }, [refresh]),
    );

    React.useEffect(() => {
        if (!error) return;
        showAlert('Failed to load notes', error, {
            primaryAction: {
                label: 'Try again',
                onPress: () => { void refresh(); },
            },
        });
    }, [error, showAlert, refresh]);

    const isLoading = !user?.id || (loading && notes.length === 0);

    return (
        <View style={ styles.container }>
            <View style={ styles.content }>
                { isLoading ? <Loading /> : (
                    <NotesListScreen
                        notes={ notes }
                        loading={ loading }
                        refresh={ refresh }
                        onUpdateNote={ handleUpdateNote }
                        progressFor={ progressFor }
                        canReview={ canReview }
                        onReviewed={ handleReviewed }
                    />
                ) }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: GRADIENTS.background.bottom,
    },
    content: {
        flex: 1,
    },
});
