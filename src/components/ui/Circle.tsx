import { View, StyleSheet } from "react-native";
import AppText from "./AppText";
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

type Props = {
    text: string;
    isActive?: boolean;
}

export default function Circle({ text, isActive }: Props) {
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={ [styles.circle, isActive && styles.circleActive] }>
            <AppText
                variant="caption"
                style={ styles.circleText }
            >
                { text }
            </AppText>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    circle: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.red.light,
    },
    circleActive: {
        backgroundColor: theme.red.light,
        borderColor: theme.red.dark,
        borderWidth: 1,
    },
    circleText: {
        color: theme.red.dark,
    },
});
