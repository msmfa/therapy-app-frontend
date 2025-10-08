import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_VARIANTS } from 'new-design';
import { GradientColors } from 'src/utils/types';

type LinearGradientCardProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
};

export default function LinearGradientCircle({ gradient, style }: LinearGradientCardProps) {
    return (
        <LinearGradient
            colors={gradient ?? [COLOR_VARIANTS.red.mid, COLOR_VARIANTS.red.dark]}
            style={[styles.gradientCircle, { top: 60, left: 100 }, style]}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 5,
    },
});



