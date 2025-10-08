import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLOR_VARIANTS } from 'new-design';
import { GradientColors } from 'src/utils/types';

type LinearGradientCardProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
};

const DEFAULT_GRADIENTS: GradientColors[] = [
    [COLOR_VARIANTS.red.mid, COLOR_VARIANTS.red.dark],
    [COLOR_VARIANTS.blue.mid, COLOR_VARIANTS.blue.dark],
    ['#8FFFD4', '#5FFFB0'],
    ['#FFE67C', '#FFDB5C'],
];

export default function LinearGradientCard({
    gradient = DEFAULT_GRADIENTS[0],
    style,
}: LinearGradientCardProps) {
    return <LinearGradient colors={gradient} style={[styles.gradientCard, style]} />;
}

const styles = StyleSheet.create({
    gradientCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
});
