import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../const';

interface Props {
	text: string;

}

export function InfoBlock({ text }: Props) {
    return (
        <View style={ styles.wrapper }>
            <Text style={ styles.text }>{ text }</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        backgroundColor: Colors.LightBlue,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        // marginBottom: 16,
        alignItems: 'center',
        gap: 10,
        borderColor: Colors.DarkBlue,
        borderWidth: 1.5,
        width: '100%',
    },
    text: {
        flex: 1,
        fontSize: 16,
        color: '#0066cc',
        lineHeight: 18,
    },
});
