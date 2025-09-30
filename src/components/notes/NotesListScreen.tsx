import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  useHeaderHeight } from '@react-navigation/elements';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Note } from '../../hooks/useNotes';
import { NotePreviewModal } from './NotesListScreenModal';
import { NoteCard } from './NoteCard';
import Header from '../ui/header';
import Typography from '../ui/typography';
import { GradientUpwards } from '../GradientUpwards';

const BOTTOM_FADE = 96; // fade height at bottom (mask)

// Color palette
const colors = {
    cardBg: '#ffffff',
    cardBgAlt: '#f8f9fa',
    scienceBg: '#e8f4fd',
    previewBg: '#e7f3ff',
    cardBorder: '#e9ecef',
    blueBorder: '#bee5eb',
    primaryText: '#111',
    secondaryText: '#666',
    mutedText: '#6c757d',
    darkGrayText: '#495057',
    blueText: '#0066cc',
    successText: '#28a745',
    primaryBtn: '#111',
};

interface NotesListScreenProps {
	notes: Note[];
	loading: boolean;
	refresh: () => void;
}

export default function NotesListScreen({ notes, loading, refresh }: NotesListScreenProps) {
    const headerHeight = useHeaderHeight();
    const nominal = 600;
    const bottomStart = Math.max(0, 1 - BOTTOM_FADE / nominal);
    const [previewNote, setPreviewNote] = React.useState<Note | null>(null);
    const isPreviewVisible = Boolean(previewNote?.id);

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View style={ { flex: 1 } }>
                <MaskedView
                    style={ { flex: 1 } }
                    maskElement={
                        <LinearGradient
                            colors={ ['#000', '#000', '#0000'] }
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
                                tintColor={ colors.primaryText }
                                colors={ [colors.primaryText] }
                            />
                        }
                        ItemSeparatorComponent={ () => <View style={ { height: 12 } } /> }
                        renderItem={ ({ item, index }) => <NoteCard item={ item } index={ index } onPress={ setPreviewNote } /> }
                        ListHeaderComponent={
                            <View style={ styles.listHeader }>
                                <Header text="Your Notes" />
                                <Typography text={ `Tap on a note to view details` } />
                            </View>
                        }
                    />
                </MaskedView>
            </View>
            <NotePreviewModal
                visible={ isPreviewVisible }
                note={ previewNote }
                onClose={ () => setPreviewNote(null) }
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
