import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaperTexture from '../../../assets/textures/paper-reference.svg';

/**
 * The grain the pale screens are printed on.
 *
 * The SVG embeds the supplied paper image unchanged and tiles it at its
 * original 326 × 270 size, preserving its colour and fine grain. It has no
 * viewBox so the texture does not stretch to fit different screen sizes.
 */
export function PaperGrain() {
    return (
        <View
            pointerEvents="none"
            style={ styles.field }
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <PaperTexture width="100%" height="100%" />
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        ...StyleSheet.absoluteFillObject,
    },
});
