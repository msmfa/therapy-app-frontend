import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GradientColors } from 'src/utils/types';
import { useTheme } from '../../context/theme';

export enum SquarePosition {
    TOP_LEFT = 'top-left',
    TOP_RIGHT = 'top-right',
    MIDDLE_RIGHT = 'middle-right',
    BOTTOM_LEFT = 'bottom-left',
    BOTTOM_RIGHT = 'bottom-right',
}

type LinearGradientSquareProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
    position?: SquarePosition;
    rotation?: string;
};

const POSITION_STYLES: Record<SquarePosition, ViewStyle> = {
    [SquarePosition.TOP_LEFT]: {
        position: 'absolute',
        top: 40,
        left: -80,
    },
    [SquarePosition.TOP_RIGHT]: {
        position: 'absolute',
        top: 0,
        left: 250,
    },
    [SquarePosition.BOTTOM_LEFT]: {
        position: 'absolute',
        top: 580,
        left: -80,
    },
    [SquarePosition.BOTTOM_RIGHT]: {
        position: 'absolute',
        top: 460,
        left: 200,
    },
    [SquarePosition.MIDDLE_RIGHT]: {
        position: 'absolute',
        top: 90,
        left: 150,
    },
};

export default function LinearGradientSquare({ gradient, style, position, rotation }: LinearGradientSquareProps) {
    const { theme } = useTheme();
    const positionStyle = position ? POSITION_STYLES[position] : undefined;
    const rotationStyle = rotation ? { transform: [{ rotate: rotation }] } : styles.defaultRotation;
    // A flat deep red by day. At night it takes the same sweep as the circle,
    // so the one screen that shows a square (the science page) is lit the
    // same way as the rest of the app.
    const defaultGradient: GradientColors = theme.scheme === 'dark'
        ? theme.accent.sweep
        : [COLOR_VARIANTS.red.dark, COLOR_VARIANTS.red.dark, COLOR_VARIANTS.red.dark];

    return (
        <LinearGradient
            colors={ gradient ?? defaultGradient }
            style={ [styles.gradientSquare, positionStyle, rotationStyle, style] }
        />
    );
}

const styles = StyleSheet.create({
    gradientSquare: {
        position: 'absolute',
        top: 60,
        left: 150,
        width: 300,
        height: 300,
        borderRadius: 56,
    },
    defaultRotation: {
        transform: [{ rotate: '6deg' }],
    },
});
