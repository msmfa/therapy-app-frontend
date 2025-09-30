
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '../../../design';

type Props = {
    text: string;
};

export default function Typography({ text }: Props) {
    return (
        <View>
            <Text style={ styles.text }>{ text }</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        lineHeight: 22,
        color: Palette.maroon,
    },
});
