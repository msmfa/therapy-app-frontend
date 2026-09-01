import { Pressable, View, StyleSheet } from "react-native";
import { Note } from "../../features/notes/useNotes";
import AppText from "../ui/AppText";
import Spacer from "../ui/Spacer";
import dayjs from 'dayjs';
import { COLOR_VARIANTS, PALETTE, TEXT_COLORS } from 'designs/designs-colors';
import { GlassCircleButton } from '../ui/GlassCircleButton';
import type { NoteReviewProgress } from '../../features/reviews';
import { ReviewProgressBar } from './ReviewProgressBar';

const PREVIEW_LINES = 4;
const OPEN_BUTTON = 32;
const PREVIEW_LINE_HEIGHT = 22;

type Props = {
    item: Note;
    index: number;
    onPress: (item: Note) => void;
    /** From `useNoteReviews().progressFor(note)`. */
    progress?: NoteReviewProgress;
}

export function NoteCard({ item, index, onPress, progress }: Props) {
    return (
        <Pressable
            onPress={ () => onPress(item) }
            style={ ({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.noteCardPressed,
                index === 0 && styles.firstCard,
            ] }
        >
            { /* Decoration, not a second target: the whole card is already
                 pressable, so this lets the tap fall through to it. The `back`
                 glyph points up-left, mirrored here to point out of the card. */ }
            <View pointerEvents='none' style={ styles.openButton }>
                <GlassCircleButton
                    accessibilityLabel='Open note'
                    icon='back'
                    iconColor={ COLOR_VARIANTS.red.primary }
                    size={ OPEN_BUTTON }
                    onPress={ () => onPress(item) }
                    style={ styles.openButtonGlass }
                />
            </View>
            <View style={ styles.noteHeader }>
                <AppText variant='h3' numberOfLines={ 1 } style={ styles.date }>
                    { dayjs(item.createdAt).format('dddd, MMM D') }
                </AppText>
                <AppText variant='caption' style={ styles.time }>
                    { dayjs(item.createdAt).format('h:mm A') }
                </AppText>
            </View>
            <AppText variant='bodySecondary' numberOfLines={ PREVIEW_LINES } style={ styles.preview }>
                { item.text }
            </AppText>

            <Spacer />
            { progress && (
                <ReviewProgressBar progress={ progress } showCaption={ false } />
            ) }

        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: PALETTE.overlay.whiteSurfaceTransparent,
        shadowColor: PALETTE.overlay.blueGlowTransparent,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.3,
        shadowRadius: 140,
        elevation: 20,
        alignSelf: 'stretch',
        paddingTop: 28,
        paddingBottom: 22,
        paddingHorizontal: 22,
    },
    noteCardPressed: {
        backgroundColor: PALETTE.overlay.whiteMediumTransparent,
        transform: [{ scale: 0.98 }],
    },
    firstCard: {
        backgroundColor: PALETTE.overlay.whiteMediumTransparent,
        shadowColor: PALETTE.overlay.blueGlowTransparent,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 24,
        borderColor: PALETTE.overlay.whiteSurfaceTransparent,
        borderWidth: 1,
    },
    preview: {
        // Fixed so every card is the same height, however short the note is.
        height: PREVIEW_LINES * PREVIEW_LINE_HEIGHT,
        lineHeight: PREVIEW_LINE_HEIGHT,
    },
    noteHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 10,
    },
    date: {
        textTransform: 'uppercase',
    },
    openButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
        // Sits behind the note itself: present enough to read as a way in,
        // faint enough not to compete with the date and the text.
        opacity: 0.55,
    },
    openButtonGlass: {
        transform: [{ scaleX: -1 }],
    },
    time: {
        color: TEXT_COLORS.tertiary,
    },
});
