import { ReactNode, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
};

const DEFAULT_BACKGROUND = 'hsla(0, 0%, 100%, 0.29)';
const DEFAULT_BORDER = 'hsla(0, 0%, 100%, 0.21)';
const MIN_HUE = 0;
const MAX_HUE = 360;

export function GradientRow({ children, addedStyles, hue }: Props) {
    const normalizedHue = useMemo(
        () => Math.max(MIN_HUE, Math.min(MAX_HUE, hue ?? 0)),
        [hue]
    );

    const hasHue = typeof hue === 'number';

    const backgroundColor = hasHue
        ? `hsla(${normalizedHue}, 70%, 90%, 0.35)`
        : DEFAULT_BACKGROUND;

    const borderColor = hasHue
        ? `hsla(${normalizedHue}, 70%, 80%, 0.3)`
        : DEFAULT_BORDER;

    return (
        <View style={ [styles.legendWrapper, addedStyles] }>
            <View style={ [styles.legendCard, { backgroundColor, borderColor }] }>
                { children }
            </View>
        </View>
    );
}

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
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
    },
});
