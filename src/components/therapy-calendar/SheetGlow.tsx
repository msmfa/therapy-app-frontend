import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/theme';

const GLOW_HEIGHT = 160;
/** The top corners every calendar sheet is cut with. */
const SHEET_RADIUS = 20;

/**
 * The blue light along the top of a calendar sheet, the same hue that sits at
 * the top of the boarding-pass reference, fading down into the surface.
 *
 * Goes first inside the sheet. It carries the sheets' top corners itself
 * rather than asking the sheet to clip, since the schedule sheet lets its
 * option cards' shadows run past its padding and clipping would cut them.
 */
export function SheetGlow() {
    const { theme } = useTheme();
    return (
        <LinearGradient
            colors={ theme.calendar.sheet.glow }
            locations={ theme.calendar.backdrop.glowLocations }
            pointerEvents="none"
            style={ styles.glow }
        />
    );
}

const styles = StyleSheet.create({
    glow: {
        borderTopLeftRadius: SHEET_RADIUS,
        borderTopRightRadius: SHEET_RADIUS,
        height: GLOW_HEIGHT,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
});
