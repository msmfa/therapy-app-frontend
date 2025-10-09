import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import { GradientColors } from 'src/utils/types';

export enum SquarePosition {
    TOP_LEFT = 'top-left',
    TOP_RIGHT = 'top-right',
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
        top: 40,
        left: 200,
    },
    [SquarePosition.BOTTOM_LEFT]: {
        position: 'absolute',
        top: 460,
        left: -80,
    },
    [SquarePosition.BOTTOM_RIGHT]: {
        position: 'absolute',
        top: 460,
        left: 200,
    },
};

export default function LinearGradientSquare({ gradient, style, position, rotation }: LinearGradientSquareProps) {
    const positionStyle = position ? POSITION_STYLES[position] : undefined;
    const rotationStyle = rotation ? { transform: [{ rotate: rotation }] } : styles.defaultRotation;

    return (
        <LinearGradient
            colors={gradient ?? [COLOR_VARIANTS.red.dark, COLOR_VARIANTS.red.dark]}
            style={[styles.gradientSquare, positionStyle, rotationStyle, style]}
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
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        elevation: 6,
    },
    defaultRotation: {
        transform: [{ rotate: '6deg' }],
    },
});
