import { Pressable, View, StyleSheet } from "react-native";
import { Note } from "../../features/notes/useNotes";
import AppText from "../ui/AppText";
import Spacer from "../ui/Spacer";
import dayjs from 'dayjs';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { GlassCircleButton } from '../ui/GlassCircleButton';
import type { NoteReviewProgress } from '../../features/reviews';
import { ReviewProgressBar } from './ReviewProgressBar';
import { useTranslation } from 'react-i18next';
import { shortDatePattern } from '../../i18n/dayjsLocale';

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

const PREVIEW_LABEL_LENGTH = 100;

export function NoteCard({ item, index, onPress, progress }: Props) {
    const { t } = useTranslation('notes');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    const dateText = dayjs(item.createdAt).format(`dddd, ${shortDatePattern()}`);
    const timeText = dayjs(item.createdAt).format('LT');
    const previewText = item.text.length > PREVIEW_LABEL_LENGTH
        ? `${item.text.slice(0, PREVIEW_LABEL_LENGTH).trimEnd()}…`
        : item.text;

    return (
        <Pressable
            onPress={ () => onPress(item) }
            accessibilityRole="button"
            accessibilityLabel={ `${dateText}, ${timeText}. ${previewText}` }
            accessibilityHint={ t('a11y.openNote') }
            style={ ({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.noteCardPressed,
                index === 0 && styles.firstCard,
            ] }
        >
            { /* Decoration, not a second target: the whole card is already
                 pressable, so this lets the tap fall through to it. The `back`
                 glyph points up-left, mirrored here to point out of the card.
                 `pointerEvents='none'` only keeps a real tap from landing on
                 it; VoiceOver's synthesized one does not respect that, so it
                 still needs hiding explicitly or it shows up as a second,
                 separately-announced "Open note" stop right next to the card
                 that already says the same thing. */ }
            <View
                pointerEvents='none'
                style={ styles.openButton }
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                <GlassCircleButton
                    accessibilityLabel={ t('a11y.openNote') }
                    icon='back'
                    iconColor={ theme.status.dangerText }
                    size={ OPEN_BUTTON }
                    onPress={ () => onPress(item) }
                    style={ styles.openButtonGlass }
                />
            </View>
            <View style={ styles.noteHeader }>
                <AppText variant='h3' numberOfLines={ 1 } style={ styles.date }>
                    { dayjs(item.createdAt).format(`dddd, ${shortDatePattern()}`) }
                </AppText>
                <AppText variant='caption' style={ styles.time }>
                    { dayjs(item.createdAt).format('LT') }
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

const makeStyles = (theme: Theme) => StyleSheet.create({
    cardWrapper: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: theme.surface.card,
        shadowColor: theme.surface.cardShadow,
        // By day a wide blue glow; at night the theme's hard black shadow,
        // thrown down and to the right.
        shadowOffset: theme.scheme === 'dark' ? theme.surface.shadowOffset : { width: 0, height: 22 },
        shadowOpacity: theme.scheme === 'dark' ? theme.surface.cardShadowOpacity : 0.3,
        shadowRadius: theme.scheme === 'dark' ? theme.surface.shadowRadius : 140,
        elevation: 20,
        alignSelf: 'stretch',
        paddingTop: 28,
        paddingBottom: 22,
        paddingHorizontal: 22,
    },
    noteCardPressed: {
        backgroundColor: theme.surface.medium,
        transform: [{ scale: 0.98 }],
    },
    firstCard: {
        backgroundColor: theme.surface.medium,
        shadowColor: theme.surface.cardShadow,
        shadowOffset: theme.scheme === 'dark' ? theme.surface.shadowOffset : { width: 0, height: 22 },
        shadowOpacity: theme.scheme === 'dark' ? theme.surface.cardShadowOpacity : 0.1,
        shadowRadius: theme.scheme === 'dark' ? theme.surface.shadowRadius : 40,
        elevation: 24,
        borderColor: theme.surface.rowBorder,
        borderTopColor: theme.surface.cardEdge,
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
        color: theme.ink.tertiary,
    },
});
