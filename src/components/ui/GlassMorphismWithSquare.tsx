import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import LinearGradientSquare, { SquarePosition } from './LinearGradientSquare';
import GlassMorphism from './GlassMorphism';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  squareStyle?: StyleProp<ViewStyle>;
  squarePosition?: SquarePosition;
  squareRotation?: string;
};

export const GlassMorphismWithSquare = ({ children, style, squarePosition, squareStyle, squareRotation }: Props) => {
    return (
        <View style={ styles.container }>
            <View style={ styles.gradientSquareContainer }>
                <LinearGradientSquare position={ squarePosition } style={ squareStyle } rotation={ squareRotation } />
            </View>
            <GlassMorphism tint="light" style={ style }>
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
    },
    gradientSquareContainer: {
        position: 'absolute',
        height: 800,
        width: 800,
    },
});
