import { View, StyleSheet, Text } from 'react-native';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

type Note = {
	createdAt: number;
	text: string;
};

export default function NoteContainer({ createdAt, text }: Note) {
    const d = dayjs(createdAt).format('ddd Do'); // "wed 14th"

    return (
        <View style={ styles.card }>
            <Text style={ styles.date }>{ d }</Text>
            <Text style={ styles.text }>{ text }</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E9BFCB',
    },
    date: { fontSize: 12, opacity: 0.7, marginBottom: 6 },
    text: { fontSize: 16, lineHeight: 22 },
});
