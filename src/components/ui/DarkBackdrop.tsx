import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
    DARK_BACKDROP_BASE,
    DARK_BACKDROP_BASE_LOCATIONS,
    DARK_BACKDROP_GLOW,
    DARK_BACKDROP_GLOW_LOCATIONS,
} from 'designs/designs-gradients';

type Props = {
    style?: StyleProp<ViewStyle>;
};

type GradientColors = [string, string, ...string[]];
type GradientLocations = [number, number, ...number[]];

// How far down the screen the warm glow reaches before it is fully transparent.
const GLOW_HEIGHT = '58%';

// The calendar screen's backdrop. Three layers, bottom to top: a pale grey
// base, a blue glow hanging off the top edge, and a light blur over both. The
// blur is what sells it — it softens the two gradients into the haze behind the
// status bar and the month title, so the top of the screen keeps a hint of
// colour while everything below settles into neutral grey.
export function DarkBackdrop({ style }: Props) {
    return (
        <View pointerEvents="none" style={ [styles.root, style] }>
            <LinearGradient
                colors={ [...DARK_BACKDROP_BASE] as GradientColors }
                locations={ [...DARK_BACKDROP_BASE_LOCATIONS] as GradientLocations }
                style={ StyleSheet.absoluteFill }
            />
            <LinearGradient
                colors={ [...DARK_BACKDROP_GLOW] as GradientColors }
                locations={ [...DARK_BACKDROP_GLOW_LOCATIONS] as GradientLocations }
                start={ { x: 0.3, y: 0 } }
                end={ { x: 0.7, y: 1 } }
                style={ styles.glow }
            />
            <BlurView pointerEvents="none" tint="light" intensity={ 14 } style={ StyleSheet.absoluteFill } />
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
