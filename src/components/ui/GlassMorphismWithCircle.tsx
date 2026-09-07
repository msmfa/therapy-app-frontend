import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LinearGradientCircle, { CirclePosition } from './LinearGradientCircle';
import GlassMorphism from './GlassMorphism';

type Props = {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Corner radius for the blurred panel; see GlassMorphism. */
    panelRadius?: number;
    circleStyle?: StyleProp<ViewStyle>;
    /** Omit to get the glass on its own: the circle is not drawn at all. */
    circlePosition?: CirclePosition;
};

export const GlassMorphismWithCircle = ({ children, style, circlePosition, circleStyle, panelRadius }: Props) => {
    return (
        <View pointerEvents="box-none" style={ styles.container }>
            { circlePosition !== undefined && (
                <View pointerEvents="none" style={ styles.colorfulCardsContainer }>
                    <LinearGradientCircle position={ circlePosition } style={ circleStyle } />
                </View>
            ) }
            <GlassMorphism tint="light" style={ style } panelRadius={ panelRadius }>
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
