import { Pressable, View, StyleSheet } from "react-native";
import { Note } from "../../hooks/useNotes";
import AppText from "../ui/AppText";
import Spacer from "../ui/Spacer";
import dayjs from 'dayjs';
import Badge from "../ui/Badge";
import { colors, palette } from '../../../new-design';

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
                <AppText variant='h3' >
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
            <AppText variant="caption" style={ styles.dateText }>
                { dayjs(item.createdAt).format('h:mm A') }
            </AppText>

        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: palette.overlay.whiteSurfaceTransparent,
        shadowColor: palette.overlay.blueGlowTransparent,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.3,
        shadowRadius: 140,
        elevation: 20,
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
        borderColor: palette.overlay.whiteSurfaceTransparent,
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
    dateText:{
        color: colors.textDisabled,
    }
});
