import { View, StyleSheet } from "react-native";
import AppText from "./AppText";

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
        shadowColor: 'hsl(220, 60%, 88%)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        backgroundColor: 'hsl(220, 70%, 90%)',
        borderWidth: 1,
        borderColor: 'hsl(220, 70%, 80%)',
    },
    circleActive: {
        backgroundColor: 'hsl(220, 70%, 85%)',
        borderColor: 'hsl(220, 70%, 40%)',
    },
    circleText: {
        color: 'hsl(220, 70%, 50%)',
    },
});
