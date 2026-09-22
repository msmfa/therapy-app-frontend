import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientColors } from 'src/utils/types';
import { useTheme } from '../../context/theme';

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

/**
 * The decorative circle behind the glass. Red by day; the theme's sweep by
 * night, which is the one place the dark app has colour that is not a mark.
 */
export default function LinearGradientCircle({ gradient, style, position }: LinearGradientCardProps) {
    const { theme } = useTheme();
    const positionStyle = position ? POSITION_STYLES[position] : undefined;

    return (
        <LinearGradient
            colors={ gradient ?? theme.accent.sweep }
            style={ [styles.gradientCircle, positionStyle, style] }
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
    },
});


