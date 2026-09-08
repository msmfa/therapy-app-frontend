import React from 'react';
import { StyleSheet, View } from 'react-native';
import PaperTexture from '../../../assets/textures/paper-reference.svg';

/**
 * Fine grey paper grain for the onboarding screens.
 *
 * The SVG embeds the supplied paper image unchanged and tiles it at its
 * original 326 × 270 size. A neutral wash deepens the paper to a soft grey
 * while preserving the grain. Lower opacity lets decorative colour show
 * through on Welcome. No viewBox means the texture keeps its native scale.
 */
export function PaperGrain({ opacity = 1 }: { opacity?: number }) {
    return (
        <View
            pointerEvents="none"
            style={ [styles.field, { opacity }] }
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <PaperTexture width="100%" height="100%" />
            <View style={ styles.greyWash } />
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        ...StyleSheet.absoluteFillObject,
    },
    greyWash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.10)',
    },
});
