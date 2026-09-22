import { ReactNode, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, ColorValue } from "react-native";
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    borderRadius?: number;
    surfaceBackgroundColor?: ColorValue;
    surfaceBorderColor?: ColorValue;
};

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
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    const normalizedHue = useMemo(
        () => Math.max(MIN_HUE, Math.min(MAX_HUE, hue ?? 0)),
        [hue]
    );

    const hasHue = typeof hue === 'number';

    // A card with no hue is a light wash over the ground; with one it is a
    // wash of that hue. Both formulas belong to the theme.
    const backgroundColor = surfaceBackgroundColor
        ?? (hasHue ? theme.surface.tinted(normalizedHue) : theme.surface.tintCard);

    const borderColor = surfaceBorderColor
        ?? (hasHue ? theme.surface.tintedBorder(normalizedHue) : theme.surface.tintCardBorder);

    const computedBorderRadius = borderRadius ?? DEFAULT_RADIUS;

    return (
        <View style={ [styles.legendWrapper, { borderRadius: computedBorderRadius }, addedStyles] }>
            <View style={ [styles.legendCard, { backgroundColor, borderColor, borderRadius: computedBorderRadius }] }>
                { children }
            </View>

        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    legendWrapper: {
        borderRadius: DEFAULT_RADIUS,
        elevation: 12,
        shadowColor: theme.surface.gradientCardShadow,
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
