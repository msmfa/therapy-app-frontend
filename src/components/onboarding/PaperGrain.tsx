import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

/**
 * The grain the pale screens are printed on.
 *
 * A tiled 160pt image rather than a drawn pattern: the texture is thousands of
 * irregular specks, which is a photograph's job, not a vector's. The tile is
 * generated to wrap at its own edges, so repeating it leaves no seam.
 *
 * The artwork is transparent, carrying only the light and dark of the grain, so
 * it sits over whatever ground it is given without shifting its colour. It is
 * decorative and never interactive.
 */
export function PaperGrain() {
    return (
        <View pointerEvents="none" style={ styles.field }>
            <Image
                source={ require('../../../assets/textures/paper-grain.png') as ImageSourcePropType }
                style={ styles.grain }
                resizeMode="repeat"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        ...StyleSheet.absoluteFillObject,
    },
    grain: {
        width: '100%',
        height: '100%',
    },
});
