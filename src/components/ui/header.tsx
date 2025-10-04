
import { StyleSheet, View } from 'react-native';
import { Palette } from '../../../design';
import AppText from './typography';

type Props = {
    text: string;
};

export default function Header({ text }: Props) {
    return (
        <View>
            <AppText style={ styles.text } color={ Palette.maroon } weight="semibold">
                { text }
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 28,
        fontWeight: '600',
        opacity: 1,
        zIndex: 110,
    },
});
