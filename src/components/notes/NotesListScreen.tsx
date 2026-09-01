import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  useHeaderHeight } from '@react-navigation/elements';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Note } from '../../features/notes/useNotes';
import type { NoteReviewProgress } from '../../features/reviews';
import { NotePreviewModal } from './NotesListScreenModal';
import { NoteCard } from './NoteCard';
import { ReviewProgressGallery } from './ReviewProgressGallery';
import { EmptyNoteCard } from './EmptyNoteCard';
import { SampleNoteCard } from './SampleNoteCard';
import { GradientCard } from '../ui/GradientCard';
import AppText from '../ui/AppText';
import { COLOR_VARIANTS } from 'designs/designs-colors';

const BOTTOM_FADE = 96; // fade height at bottom (mask)
const HEADER_GAP = 20; // gap between the pinned header and the first note
// The fade is longer than the gap: a note scrolling up under the header has to
// be gone before it reaches the box, and at the gap's length it cut off hard.
const TOP_FADE = 44;

interface NotesListScreenProps {
	notes: Note[];
	loading: boolean;
	refresh: () => void;
	onUpdateNote: (id: string, text: string) => Promise<void>;
	progressFor?: (note: Note) => NoteReviewProgress;
	/** False when nothing is answerable right now, or the slot is already ticked. */
	canReview?: (note: Note) => boolean;
	onReviewed?: (note: Note) => Promise<void>;
}

type PinnedHeaderProps = {
    expanded: boolean;
    onToggle: () => void;
};

/**
 * The page label plus the explainer box, pinned together.
 *
 * Rendered twice: once absolutely over the list, and once inside it at zero
 * opacity so the content starts below and fades away underneath the whole
 * block rather than only under the label.
 */
function PinnedHeader({ expanded, onToggle }: PinnedHeaderProps) {
    return (
        <View style={ styles.header }>
            <AppText variant='h3' style={ styles.headerLabel }>
                Notes
            </AppText>
            <View style={ styles.gallery }>
                <ReviewProgressGallery expanded={ expanded } onToggle={ onToggle } />
            </View>
        </View>
    );
}

export default function NotesListScreen({
    notes,
    loading,
    refresh,
    onUpdateNote,
    progressFor,
    canReview,
    onReviewed,
}: NotesListScreenProps) {
    const headerHeight = useHeaderHeight();
    const [listHeight, setListHeight] = React.useState(0);
    const [headerBlockHeight, setHeaderBlockHeight] = React.useState(0);
    const [previewNote, setPreviewNote] = React.useState<Note | null>(null);
    const [galleryExpanded, setGalleryExpanded] = React.useState(false);

    const toggleGallery = React.useCallback(() => setGalleryExpanded((open) => !open), []);

    const nominal = listHeight || 600;
    // Notes are masked out above the bottom of the pinned header, then fade in
    // across the gap, so nothing is ever visible through the header text.
    const headerBottom = headerBlockHeight > 0 ? headerHeight + headerBlockHeight : 0;
    const topStart = Math.min(1, headerBottom / nominal);
    const topEnd = Math.min(1, (headerBottom + TOP_FADE) / nominal);
    const bottomStart = Math.max(topEnd, 1 - BOTTOM_FADE / nominal);

    React.useEffect(() => {
        if (!previewNote) return;
        const latest = notes.find((n) => n.id === previewNote.id);
        if (latest && latest !== previewNote) {
            setPreviewNote(latest);
        }
    }, [notes, previewNote]);

    // The spacer reserves the exact height of the pinned header, so the list never
    // depends on a measurement to be positioned correctly. Measuring it only moves
    // the point where the fade finishes.
    const onSpacerLayout = React.useCallback((e: LayoutChangeEvent) => {
        setHeaderBlockHeight(e.nativeEvent.layout.height);
    }, []);

    const onContainerLayout = React.useCallback((e: LayoutChangeEvent) => {
        setListHeight(e.nativeEvent.layout.height);
    }, []);

    const isPreviewVisible = Boolean(previewNote?.id);

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <View style={ { flex: 1 } } onLayout={ onContainerLayout }>
                <MaskedView
                    style={ { flex: 1 } }
                    maskElement={
                        <LinearGradient
                            colors={ [
                                COLOR_VARIANTS.transparent,
                                COLOR_VARIANTS.transparent,
                                COLOR_VARIANTS.black.primary,
                                COLOR_VARIANTS.black.primary,
                                COLOR_VARIANTS.transparent,
                            ] }
                            locations={ [0, topStart, topEnd, bottomStart, 1] }
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
                                paddingTop: headerHeight,
                                paddingBottom: BOTTOM_FADE + 16,
                            },
                        ] }
                        scrollIndicatorInsets={ { top: headerBottom, bottom: BOTTOM_FADE } }
                        refreshControl={
                            <RefreshControl
                                refreshing={ loading }
                                onRefresh={ refresh }
                                progressViewOffset={ headerBottom + HEADER_GAP }
                                tintColor={ COLOR_VARIANTS.black.primary }
                                colors={ [COLOR_VARIANTS.black.primary] }
                            />
                        }
                        ItemSeparatorComponent={ () => <View style={ { height: 12 } } /> }
                        renderItem={ ({ item, index }) => (
                            <NoteCard
                                item={ item }
                                index={ index }
                                onPress={ setPreviewNote }
                                progress={ progressFor?.(item) }
                            />
                        ) }
                        ListEmptyComponent={
                            <GradientCard>
                                { /* The card supplies 20 horizontally; this
                                     matches it vertically. */ }
                                <View style={ styles.emptyCard }>
                                    <EmptyNoteCard>
                                        <SampleNoteCard />
                                    </EmptyNoteCard>
                                </View>
                            </GradientCard>
                        }
                        ListHeaderComponent={
                            <View
                                style={ styles.headerSpacer }
                                pointerEvents='none'
                                onLayout={ onSpacerLayout }
                            >
                                <PinnedHeader expanded={ galleryExpanded } onToggle={ toggleGallery } />
                            </View>
                        }
                    />
                </MaskedView>
                { /* box-none, not none: the explainer inside is tappable. */ }
                <View pointerEvents='box-none' style={ [styles.pinnedHeader, { top: headerHeight }] }>
                    <PinnedHeader expanded={ galleryExpanded } onToggle={ toggleGallery } />
                </View>
            </View>
            <NotePreviewModal
                visible={ isPreviewVisible }
                note={ previewNote }
                onClose={ () => setPreviewNote(null) }
                onUpdateNote={ onUpdateNote }
                canReview={ previewNote ? (canReview?.(previewNote) ?? false) : false }
                onReviewed={ onReviewed }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingBottom: 70,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    emptyCard: {
        paddingVertical: 20,
    },
    header: {
        paddingTop: 20,
    },
    headerLabel: {
        // Indented to the same left edge as the content inside the cards and
        // the explainer box, which sit at the list padding plus their own.
        paddingLeft: 22,
        fontSize: 20,
        lineHeight: 28,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gallery: {
        marginTop: 10,
    },
    headerSpacer: {
        opacity: 0,
        marginBottom: HEADER_GAP,
    },
    pinnedHeader: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
});
