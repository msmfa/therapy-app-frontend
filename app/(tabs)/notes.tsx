import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes } from '../../src/features/notes/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import Loading from '../../src/components/ui/Loading';
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';

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
        return (
            <View style={ styles.container }>
                <View pointerEvents='none' style={ styles.background }>
                    <GlassMorphismWithCircle />
                </View>
                <View style={ styles.content }>
                    <Loading />
                </View>
            </View>
        );
    }

    if (notes.length === 0) {
        return <EmptyNotesScreen  />;
    }

    return (
        <View style={ styles.container }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_LEFT } />
            </View>
            <View style={ styles.content }>
                <NotesListScreen

                    notes={ notes }
                    loading={ loading }
                    refresh={ refresh }
                    onUpdateNote={ handleUpdateNote }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: StyleSheet.absoluteFillObject,
    content: {
        flex: 1,
    },
});
