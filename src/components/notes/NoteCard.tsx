import { Pressable, View, StyleSheet } from "react-native";
import { Note } from "../../hooks/useNotes";
import AppText from "../ui/AppText";
import Spacer from "../ui/Spacer";
import dayjs from 'dayjs';
import Badge from "../ui/Badge";
import { palette } from '../../../new-design';

type Props = {
    item: Note;
    index: number;
    onPress: (item: Note) => void;
}

export function NoteCard({ item, index, onPress }: Props) {
    return (
        <Pressable
            onPress={ () => onPress(item) }
            style={ ({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.noteCardPressed,
                index === 0 && styles.firstCard,
            ] }
        >
            <View style={ styles.noteHeader }>
                <AppText variant='h2' >
                    { dayjs(item.createdAt).format('dddd, MMM D, YYYY') }
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
            <AppText variant="caption">
                { dayjs(item.createdAt).format('h:mm A') }
            </AppText>

        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: palette.overlay.whiteSoftTransparent,
        shadowColor: palette.overlay.navyGlowTransparent,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 24,
        alignSelf: 'stretch',
        paddingVertical: 22,
        paddingHorizontal: 22,
    },

    noteCardPressed: {
        backgroundColor: palette.overlay.whiteMediumTransparent,
        transform: [{ scale: 0.98 }],
    },
    firstCard: {
        backgroundColor: palette.overlay.whiteMediumTransparent,
        shadowColor: palette.overlay.blueGlowTransparent,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 24,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,

    },
    latestBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderTopRightRadius: 8,
        position: 'absolute',
        right: -16,
        top: -16,
    },
});
