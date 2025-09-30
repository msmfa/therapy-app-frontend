import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

type Prop = {
    children: ReactNode;
}

export function GradientRow({ children }: Prop) {
    return (
        <View style={ styles.legendWrapper }>
            <View style={ styles.legendCard }>
                { children }
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    legendWrapper: {
        borderRadius: 16,
        elevation: 12,
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },

    legendCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.29)',
        borderColor: 'rgba(255, 255, 255, 0.21)',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
    }
})
