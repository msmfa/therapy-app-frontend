import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import { GradientColors } from 'src/utils/types';

type LinearGradientCirclePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type LinearGradientCardProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
    position?: LinearGradientCirclePosition;
};

export enum CirclePosition {
    TOP_LEFT = 'top-left',
    TOP_RIGHT = 'top-right',
    BOTTOM_LEFT = 'bottom-left',
    BOTTOM_RIGHT = 'bottom-right',
}

const POSITION_STYLES: Record<CirclePosition, ViewStyle> = {
    [CirclePosition.TOP_LEFT]: {
        position: 'absolute',
        top: 60,
        left: -100,
    },
    [CirclePosition.TOP_RIGHT]: {
        position: 'absolute',
        top: 60,
        left: 150,
    },
    [CirclePosition.BOTTOM_LEFT]: {
        position: 'absolute',
        top: 490,
        left: -100,
    },
    [CirclePosition.BOTTOM_RIGHT]: {
        position: 'absolute',
        top: 490,
        left: 150,
    },
};

export default function LinearGradientCircle({ gradient, style, position }: LinearGradientCardProps) {
    const positionStyle = position ? POSITION_STYLES[position] : undefined;

    return (
        <LinearGradient
            colors={gradient ?? [COLOR_VARIANTS.red.mid, COLOR_VARIANTS.red.dark]}
            style={[styles.gradientCircle, positionStyle, style]}
        />
    );
}

const styles = StyleSheet.create({
    gradientCircle: {
        position: 'absolute',
        top: 60,
        left: 100,
        width: 400,
        height: 400,
        borderRadius: 200,
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 5,
    },
});


