import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes } from '../../src/features/notes/useNotes';
import EmptyNotesScreen from '../../src/components/notes/EmptyNotesScreen';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import Loading from '../../src/components/ui/Loading';
import { useAppAlert } from '../../src/context/alert';
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { GRADIENTS } from 'designs/designs-gradients';

export default function NotesScreen() {
    const { user } = useAuth();
    const { notes, loading, error, refresh, updateNote } = useNotes(user?.id);
    const { showAlert } = useAppAlert();

    const handleUpdateNote = React.useCallback(
        async (noteId: string, text: string) => {
            await updateNote(noteId, { text });
        },
        [updateNote],
    );

    const [isFocused, setIsFocused] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            setIsFocused(true);
            void refresh({ silent: true });
            return () => setIsFocused(false);
        }, [refresh]),
    );

    React.useEffect(() => {
        if (!error || !isFocused) return;
        showAlert('Failed to load notes', error, {
            primaryAction: {
                label: 'Try again',
                onPress: () => { void refresh(); },
            },
        });
    }, [error, isFocused, showAlert, refresh]);

    const isLoading = !user?.id || (loading && notes.length === 0);

    if (!isLoading && notes.length === 0) {
        return <EmptyNotesScreen />;
    }

    return (
        <View style={ styles.container }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_LEFT } />
            </View>
            <View style={ styles.content }>
                { isLoading ? <Loading /> : (
                    <NotesListScreen
                        notes={ notes }
                        loading={ loading }
                        refresh={ refresh }
                        onUpdateNote={ handleUpdateNote }
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
    background: StyleSheet.absoluteFillObject,
    content: {
        flex: 1,
    },
});
