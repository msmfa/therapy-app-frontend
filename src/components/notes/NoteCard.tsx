import { Pressable, View, StyleSheet } from "react-native";
import { Note } from "../../features/notes/useNotes";
import AppText from "../ui/AppText";
import Spacer from "../ui/Spacer";
import dayjs from 'dayjs';
import Badge from "../ui/Badge";
import { PALETTE, TEXT_COLORS } from 'designs/designs-colors';
import { TEST_IDS } from '../../constants/testIDs';

type Props = {
    item: Note;
    index: number;
    onPress: (item: Note) => void;
}

export function NoteCard({ item, index, onPress }: Props) {
    const dayLabel = dayjs(item.createdAt).format('dddd, MMM D, YYYY');
    const timeLabel = dayjs(item.createdAt).format('h:mm A');

    return (
        <Pressable
            testID={ TEST_IDS.notes.card(index) }
            onPress={ () => onPress(item) }
            // A Pressable is one accessibility element, so its children are not
            // announced individually. Without an explicit label that left the
            // card silent under VoiceOver: it read as an unlabelled button and
            // the note itself was never spoken. The label mirrors what is on
            // screen, in the same order.
            accessibilityRole="button"
            accessibilityLabel={ `${dayLabel}. ${item.text}. ${timeLabel}` }
            style={ ({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.noteCardPressed,
                index === 0 && styles.firstCard,
            ] }
        >
            <View style={ styles.noteHeader }>
                <AppText variant='h3' >
                    { dayLabel }
                </AppText>
                { index === 0 && (
                    <View style={ styles.latestBadge }>
                        <Badge>Last session</Badge>
                    </View>
                ) }
            </View>
            <AppText variant='bodySecondary' numberOfLines={ 3 }>
                { item.text }
            </AppText>

            <Spacer />
            <AppText variant="caption" style={ { color: TEXT_COLORS.tertiary } }>
                { timeLabel }
            </AppText>

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
        paddingVertical: 22,
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
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    latestBadge: {
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRadius: 4,
        borderTopRightRadius: 8,
        position: 'absolute',
        right: -16,
        top: -16,
    },
});
