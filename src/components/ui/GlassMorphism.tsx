import { BlurView, BlurViewProps } from "expo-blur";
import { StyleProp, View, StyleSheet, ViewStyle } from "react-native";
import { ReactNode } from "react";
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

/** The rounding an inset glass panel takes, where it reads as a card. */
export const GLASS_CARD_RADIUS = 48;

interface GlassProps extends BlurViewProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    /**
     * Corner radius for the blurred panel itself.
     *
     * Square by default, because most callers use this as a full-bleed
     * background: there, rounding the panel cut its own corners out of the
     * screen and left the container's pale surface showing as an inset
     * rounded outline, most visibly as a seam above the home indicator.
     *
     * A caller that insets the panel with padding is drawing a card rather than
     * a background, and gives it a radius.
     */
    panelRadius?: number;
};

/**
 * The sheet of glass most screens sit behind.
 *
 * The blur's tint follows the theme unless a caller overrides it: light glass
 * over a dark ground reads as a grey film rather than as glass.
 */
export default function GlassMorphism({ children, style, panelRadius = 0, tint, ...blurViewProps }: GlassProps) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <View pointerEvents="box-none" style={ [styles.glassContainer, style] }>
            <BlurView
                pointerEvents="box-none"
                tint={ tint ?? theme.glass.tint }
                { ...blurViewProps }
                style={ [styles.glassPanel, { borderRadius: panelRadius }] }
            >
                { children }
            </BlurView>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    glassContainer: {
        flex: 1,
        backgroundColor: theme.glass.background,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 5,
    },
    glassPanel: {
        flex: 1,
        overflow: 'hidden',
    },
});
