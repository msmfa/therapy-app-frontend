import React from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Svg, { Defs, Image, Pattern, Rect } from 'react-native-svg';

const PAPER_TEXTURE = require('../../../assets/textures/paper-reference.png') as number;
const TEXTURE_WIDTH = 326;
const TEXTURE_HEIGHT = 270;

/**
 * Fine grey paper grain for the onboarding screens.
 *
 * The original reference pixels supply both the grey tone and the grain.
 * Tile at device-pixel scale so Retina displays do not enlarge the grain.
 * Lower opacity lets Welcome's decorative circle show through the paper.
 */
export function PaperGrain({ opacity = 1 }: { opacity?: number }) {
    const density = PixelRatio.get();
    const tileWidth = TEXTURE_WIDTH / density;
    const tileHeight = TEXTURE_HEIGHT / density;

    return (
        <View
            pointerEvents="none"
            style={ [styles.field, { opacity }] }
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Svg width="100%" height="100%">
                <Defs>
                    <Pattern
                        id="paperGrain"
                        patternUnits="userSpaceOnUse"
                        width={ tileWidth }
                        height={ tileHeight }
                    >
                        <Image href={ PAPER_TEXTURE } width={ tileWidth } height={ tileHeight } />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#paperGrain)" />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        ...StyleSheet.absoluteFillObject,
    },
});
