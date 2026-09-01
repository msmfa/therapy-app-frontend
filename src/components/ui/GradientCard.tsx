import { ReactNode, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, ColorValue } from "react-native";
import { PALETTE } from 'designs/designs-colors';
import { SURFACE_TINTS } from 'designs/designs-gradients';

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    borderRadius?: number;
    surfaceBackgroundColor?: ColorValue;
    surfaceBorderColor?: ColorValue;
};

const DEFAULT_BACKGROUND = SURFACE_TINTS.defaultBackground;
const DEFAULT_BORDER = SURFACE_TINTS.defaultBorder;
const DEFAULT_RADIUS = 16;
const MIN_HUE = 0;
const MAX_HUE = 360;

export function GradientCard({
    children,
    addedStyles,
    hue,
    borderRadius,
    surfaceBackgroundColor,
    surfaceBorderColor,
}: Props) {
    const normalizedHue = useMemo(
        () => Math.max(MIN_HUE, Math.min(MAX_HUE, hue ?? 0)),
        [hue]
    );

    const hasHue = typeof hue === 'number';

    const backgroundColor = surfaceBackgroundColor
        ?? (hasHue ? SURFACE_TINTS.tintedBackground(normalizedHue) : DEFAULT_BACKGROUND);

    const borderColor = surfaceBorderColor
        ?? (hasHue ? SURFACE_TINTS.tintedBorder(normalizedHue) : DEFAULT_BORDER);

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
        shadowColor: PALETTE.overlay.blackLightTransparent,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },
    legendCard: {
        borderRadius: DEFAULT_RADIUS,
        borderWidth: 1,
        paddingHorizontal: 20,
        // paddingVertical: 10,
    },
});
