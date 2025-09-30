import { Pressable, View, StyleSheet, Text } from "react-native";
import { Note } from "../../hooks/useNotes";
import { Palette } from "../../../design";

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
                <Text style={ styles.noteDate }>
                    { new Date(item.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }) }
                </Text>
                { index === 0 && (
                    <View style={ styles.latestBadge }>
                        <Text style={ styles.latestBadgeText }>LAST SESSION</Text>
                    </View>
                ) }
            </View>
            <Text style={ styles.noteText } numberOfLines={ 3 }>
                { item.text }
            </Text>
            <View style={ styles.noteFooter }>
                <Text style={ styles.noteTime }>
                    { new Date(item.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                    }) }
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        flex: 1,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.22)',
        shadowColor: 'rgba(86, 168, 255, 0.45)',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 24,
        alignSelf: 'stretch',
        paddingVertical: 22,
        paddingHorizontal: 22,
    },

    noteCardPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.47)',
        transform: [{ scale: 0.98 }],
    },
    firstCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.47)',
        shadowColor: 'rgba(86, 168, 255, 0.45)',
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
    noteDate: {
        fontSize: 12,
        fontWeight: '600',
        color: Palette.greyDarkest2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    latestBadge: {
        backgroundColor: 'rtgba(255, 220, 220, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    latestBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'grey',
        letterSpacing: 0.5,
    },
    noteText: {
        fontSize: 15,
        lineHeight: 22,
        color: 'grey',
        marginBottom: 12,
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteTime: {
        fontSize: 12,
        color: 'grey',
    },

});
