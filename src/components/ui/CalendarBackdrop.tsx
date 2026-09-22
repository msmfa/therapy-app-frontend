import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/theme';

type Props = {
    style?: StyleProp<ViewStyle>;
};

// How far down the screen the glow reaches before it is fully transparent.
const GLOW_HEIGHT = '58%';

// The calendar screen's backdrop. Three layers, bottom to top: a sheet lifted
// just off the ground, a glow hanging off the top edge, and a light blur over
// both. The blur is what sells it: it softens the two gradients into the haze
// behind the status bar and the month title, so the top of the screen keeps a
// hint of colour while everything below settles into the sheet.
//
// Every colour comes from theme.calendar.backdrop. By day the sheet is a pale
// grey over the app's pale blue with a blue glow; at night it is a hair of
// white over the charcoal with the hologram's violet.
export function CalendarBackdrop({ style }: Props) {
    const { theme } = useTheme();
    const { base, baseLocations, glow, glowLocations, blurTint, blurIntensity } = theme.calendar.backdrop;

    return (
        <View pointerEvents="none" style={ [styles.root, style] }>
            <LinearGradient
                colors={ base }
                locations={ baseLocations }
                style={ StyleSheet.absoluteFill }
            />
            <LinearGradient
                colors={ glow }
                locations={ glowLocations }
                start={ { x: 0.3, y: 0 } }
                end={ { x: 0.7, y: 1 } }
                style={ styles.glow }
            />
            <BlurView pointerEvents="none" tint={ blurTint } intensity={ blurIntensity } style={ StyleSheet.absoluteFill } />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: GLOW_HEIGHT,
    },
});
