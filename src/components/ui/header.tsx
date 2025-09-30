
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../../design';

type Props = {
    text: string;
};

export default function Header({ text }: Props) {
    return (
        <View>
            <Text style={ styles.text }>{ text }</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 28,
        fontWeight: '600',
        color: Palette.maroon,
        opacity: 1,
        zIndex: 110,
    },
});
