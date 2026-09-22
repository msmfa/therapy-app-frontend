import React from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import Svg, { Defs, Image, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../../context/theme';

const PAPER_TEXTURE = require('../../../assets/textures/paper-reference.png') as number;
// The same tile with its luminance inverted: dark speckle on dark, so at night
// the grain darkens the charcoal in the same places it lightens the pale
// ground by day. Generated from paper-reference.png with CIColorInvert; do
// not edit it by hand, regenerate it.
const PAPER_TEXTURE_NIGHT = require('../../../assets/textures/paper-reference-dark.png') as number;
const TEXTURE_WIDTH = 326;
const TEXTURE_HEIGHT = 270;

/**
 * How much of the grain shows at night. The inverted tile is a full-strength
 * texture like the day's, but on charcoal the eye reads the same speckle as
 * noise rather than paper, so it is let down to half.
 */
const NIGHT_STRENGTH = 0.5;

/**
 * Fine grey paper grain for the onboarding screens.
 *
 * The original reference pixels supply both the grey tone and the grain.
 * Tile at device-pixel scale so Retina displays do not enlarge the grain.
 * Lower opacity lets Welcome's decorative circle show through the paper.
 */
export function PaperGrain({ opacity = 1 }: { opacity?: number }) {
    const { theme } = useTheme();
    const density = PixelRatio.get();
    const tileWidth = TEXTURE_WIDTH / density;
    const tileHeight = TEXTURE_HEIGHT / density;
    const isNight = theme.scheme === 'dark';
    const texture = isNight ? PAPER_TEXTURE_NIGHT : PAPER_TEXTURE;
    const strength = isNight ? opacity * NIGHT_STRENGTH : opacity;

    return (
        <View
            pointerEvents="none"
            style={ [styles.field, { opacity: strength }] }
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
                        <Image href={ texture } width={ tileWidth } height={ tileHeight } />
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
