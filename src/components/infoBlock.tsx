import { View, StyleSheet } from 'react-native';
import { Colors } from '../const';
import AppText from './ui/AppText';

interface Props {
	text: string;

}

export function InfoBlock({ text }: Props) {
    return (
        <View style={ styles.wrapper }>
            <AppText style={ styles.text } color="#0066CC">
                { text }
            </AppText>
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
        lineHeight: 18,
    },
});
