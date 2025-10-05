import { ReactNode, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { palette, surfaces } from '../../../new-design';

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    borderRadius?: number;
};

const DEFAULT_BACKGROUND = surfaces.gradientRow.defaultBackground;
const DEFAULT_BORDER = surfaces.gradientRow.defaultBorder;
const DEFAULT_RADIUS = 16;
const MIN_HUE = 0;
const MAX_HUE = 360;

export function GradientRow({ children, addedStyles, hue, borderRadius }: Props) {
    const normalizedHue = useMemo(
        () => Math.max(MIN_HUE, Math.min(MAX_HUE, hue ?? 0)),
        [hue]
    );

    const hasHue = typeof hue === 'number';

    const backgroundColor = hasHue
        ? surfaces.gradientRow.tintedBackground(normalizedHue)
        : DEFAULT_BACKGROUND;

    const borderColor = hasHue
        ? surfaces.gradientRow.tintedBorder(normalizedHue)
        : DEFAULT_BORDER;

    const computedBorderRadius = borderRadius ?? DEFAULT_RADIUS;

    return (
        <View style={ [styles.legendWrapper, { borderRadius: computedBorderRadius }, addedStyles] }>
            <View style={ [styles.legendCard, { backgroundColor, borderColor, borderRadius: computedBorderRadius }] }>
                { children }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    legendWrapper: {
        borderRadius: DEFAULT_RADIUS,
        elevation: 12,
        shadowColor: palette.overlay.blackLightTransparent,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },
    legendCard: {
        borderRadius: DEFAULT_RADIUS,
        borderWidth: 1,
        paddingHorizontal: 20,
    },
});
