import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COMPONENT_COLORS, PALETTE } from 'designs/designs-colors';

/**
 * The pane a date or time picker sits in.
 *
 * A picker is a panel that appears over the page, and every panel in this app
 * is made of glass. Printed straight onto a card the wheel read as part of the
 * card's own surface, and the compact controls read as system furniture that
 * had wandered in.
 *
 * Shared rather than repeated per screen: there are pickers on the session
 * date, the reminder times, the reminder settings and the calendar's schedule
 * sheet, and four copies of a blurred panel drift apart within a release.
 */

type Props = {
    children: React.ReactNode;
    /**
     * Corner radius. The default suits a full-width wheel; a compact control
     * that hugs its own content takes a smaller one.
     */
    radius?: number;
    /** Layout: width, margins, and any inset the caller needs to cancel. */
    style?: StyleProp<ViewStyle>;
};

export function GlassPickerPanel({ children, radius = 22, style }: Props) {
    return (
        <BlurView
            intensity={ 40 }
            tint="light"
            // overflow: hidden clips the blur to the panel's own corners;
            // without it the blur squares off the rounding underneath.
            style={ [styles.panel, { borderRadius: radius }, style] }
        >
            { children }
        </BlurView>
    );
}

const styles = StyleSheet.create({
    panel: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: COMPONENT_COLORS.glassBackground,
    },
});
