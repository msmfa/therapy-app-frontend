import { View, StyleSheet } from "react-native";
import AppText from "./AppText";
import { COLOR_VARIANTS } from "new-design";

type Props = {
    text: string;
    isActive?: boolean;
}

export default function Circle({ text, isActive }: Props) {
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

const styles = StyleSheet.create({
    circle: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLOR_VARIANTS.blue.light,
    },
    circleActive: {
        backgroundColor: COLOR_VARIANTS.blue.light,
        borderColor: COLOR_VARIANTS.blue.dark,
        borderWidth: 1,
    },
    circleText: {
        color: COLOR_VARIANTS.blue.dark,
    },
});
