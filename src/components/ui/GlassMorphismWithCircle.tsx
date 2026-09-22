import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LinearGradientCircle, { CirclePosition } from './LinearGradientCircle';
import GlassMorphism from './GlassMorphism';
import { useTheme } from '../../context/theme';

type Props = {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Corner radius for the blurred panel; see GlassMorphism. */
    panelRadius?: number;
    circleStyle?: StyleProp<ViewStyle>;
    /** Omit to get the glass on its own: the circle is not drawn at all. */
    circlePosition?: CirclePosition;
};

/**
 * The pale screens' ground: a sheet of glass over the app's colour, with a
 * gradient circle blurred behind it where a screen asks for one.
 *
 * At night there is no glass. The reference's panels are flat charcoal that
 * gets its depth from the shadows of the things on it, and a blurred dark
 * tint over the ground only greyed it; a gradient behind it read as a smear.
 * So the night ground is the theme's ground colour, flat, with the children
 * laid straight on it.
 */
export const GlassMorphismWithCircle = ({ children, style, circlePosition, circleStyle, panelRadius }: Props) => {
    const { theme } = useTheme();

    if (theme.scheme === 'dark') {
        return (
            <View pointerEvents="box-none" style={ [styles.container, { backgroundColor: theme.ground.base }, style] }>
                { children }
            </View>
        );
    }

    return (
        <View pointerEvents="box-none" style={ styles.container }>
            { circlePosition !== undefined && (
                <View pointerEvents="none" style={ styles.colorfulCardsContainer }>
                    <LinearGradientCircle position={ circlePosition } style={ circleStyle } />
                </View>
            ) }
            <GlassMorphism style={ style } panelRadius={ panelRadius }>
                { children }
            </GlassMorphism>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    colorfulCardsContainer: {
        position: 'absolute',
        height: 800,
        width: 800,
        zIndex: -1,
    },
});
