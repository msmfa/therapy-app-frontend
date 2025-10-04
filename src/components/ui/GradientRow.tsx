import { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

type Prop = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
}

export function GradientRow({ children, addedStyles }: Prop) {
    return (
        <View style={ [styles.legendWrapper, addedStyles] }>
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
        shadowColor: '#00000026',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },

    legendCard: {
        backgroundColor: '#FFFFFF4A',
        borderColor: '#FFFFFF36',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        // paddingVertical: 18,
    }
})
