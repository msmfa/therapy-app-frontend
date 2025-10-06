import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  useHeaderHeight } from '@react-navigation/elements';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Note } from '../../hooks/useNotes';
import { NotePreviewModal } from './NotesListScreenModal';
import { NoteCard } from './NoteCard';
import AppText from '../ui/AppText';
import { GradientUpwards } from '../GradientUpwards';
import { palette } from '../../../new-design';

const BOTTOM_FADE = 96; // fade height at bottom (mask)

interface NotesListScreenProps {
	notes: Note[];
	loading: boolean;
	refresh: () => void;
	onUpdateNote: (id: string, text: string) => Promise<void>;
}

export default function NotesListScreen({ notes, loading, refresh, onUpdateNote }: NotesListScreenProps) {
    const headerHeight = useHeaderHeight();
    const nominal = 600;
    const bottomStart = Math.max(0, 1 - BOTTOM_FADE / nominal);
    const [previewNote, setPreviewNote] = React.useState<Note | null>(null);

    React.useEffect(() => {
        if (!previewNote) return;
        const latest = notes.find((n) => n.id === previewNote.id);
        if (latest && latest !== previewNote) {
            setPreviewNote(latest);
        }
    }, [notes, previewNote]);

    const isPreviewVisible = Boolean(previewNote?.id);

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View style={ { flex: 1 } }>
                <MaskedView
                    style={ { flex: 1 } }
                    maskElement={
                        <LinearGradient
                            colors={ [palette.red.deep, palette.neutral.black, palette.neutral.transparentTransparent] }
                            locations={ [0, bottomStart, 1] }
                            start={ { x: 0, y: 0 } }
                            end={ { x: 0, y: 1 } }
                            style={ StyleSheet.absoluteFill }
                        />
                    }
                >
                    <FlatList
                        data={ notes }
                        keyExtractor={ (n) => n.id }
                        contentContainerStyle={ [
                            styles.listContent,
                            {
                                paddingTop: headerHeight + 20,
                                paddingBottom: BOTTOM_FADE + 16,
                            },
                        ] }
                        refreshControl={
                            <RefreshControl
                                refreshing={ loading }
                                onRefresh={ refresh }
                                tintColor={ palette.neutral.black }
                                colors={ [palette.neutral.black] }
                            />
                        }
                        ItemSeparatorComponent={ () => <View style={ { height: 12 } } /> }
                        renderItem={ ({ item, index }) => <NoteCard item={ item } index={ index } onPress={ setPreviewNote } /> }
                        ListHeaderComponent={
                            <View style={ styles.listHeader }>
                                <AppText variant='h1'>
                                    Your Notes
                                </AppText>
                                <AppText variant='body'>
                                    Tap on a note to view details
                                </AppText>
                            </View>
                        }
                    />
                </MaskedView>
            </View>
            <NotePreviewModal
                visible={ isPreviewVisible }
                note={ previewNote }
                onClose={ () => setPreviewNote(null) }
                onUpdateNote={ onUpdateNote }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    listHeader: {
        marginBottom: 20,
    },
});
