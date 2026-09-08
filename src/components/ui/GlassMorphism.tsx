import { BlurView, BlurViewProps } from "expo-blur";
import { StyleProp, View, StyleSheet, ViewStyle } from "react-native";
import { COMPONENT_COLORS, PALETTE } from 'designs/designs-colors';
import { ReactNode } from "react";

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

export default function GlassMorphism({ children, style, panelRadius = 0, ...blurViewProps }: GlassProps) {
    return (
        <View pointerEvents="box-none" style={ [styles.glassContainer, style] }>
            <BlurView
                pointerEvents="box-none"
                tint={ blurViewProps.tint }
                { ...blurViewProps }
                style={ [styles.glassPanel, { borderRadius: panelRadius }] }
            >
                { children }
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    glassContainer: {
        flex: 1,
        backgroundColor: COMPONENT_COLORS.glassBackground,
        shadowColor: PALETTE.neutral.black,
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
