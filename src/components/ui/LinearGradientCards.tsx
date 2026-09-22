import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientColors } from 'src/utils/types';
import { CARD_GRADIENTS } from 'designs/designs-gradients';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

type LinearGradientCardProps = {
    gradient?: GradientColors;
    style?: StyleProp<ViewStyle>;
};

export default function LinearGradientCard({
    gradient = CARD_GRADIENTS[0],
    style,
}: LinearGradientCardProps) {
    const styles = useThemedStyles(makeStyles);
    return <LinearGradient colors={ gradient } style={ [styles.gradientCard, style] } />;
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    gradientCard: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 24,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
});
