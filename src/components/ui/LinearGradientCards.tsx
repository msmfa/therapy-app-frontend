import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientColors } from 'src/utils/types';
import { CARD_GRADIENTS } from 'designs/designs-gradients';
import { PALETTE } from 'designs/designs-colors';

type LinearGradientCardProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
};

export default function LinearGradientCard({
    gradient = CARD_GRADIENTS[0],
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
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
});
