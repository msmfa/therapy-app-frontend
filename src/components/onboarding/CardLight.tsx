import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CardLight as CardLightSpec } from 'designs/designs-theme-shape';

type Props = {
    light: CardLightSpec;
    /** The card's own corner radius. */
    radius: number;
    /** The card's border width, which the light paints over. */
    borderWidth?: number;
};

/** How much of the card's edge the rim takes. */
const RIM_WIDTH = 1;

const TOP_LEFT = { x: 0, y: 0 };
const BOTTOM_RIGHT = { x: 1, y: 1 };

/**
 * The reference's corner light, painted onto a card behind its content.
 *
 * Two diagonal gradients. The rim fills the whole card, border and all, so
 * the card's own border must be transparent where this is drawn. The face
 * sits inset by the rim's width and covers the rest, so only a hairline of
 * the rim shows round the edge. Both are pushed out over the border, so the
 * content keeps the layout the border gives it and nothing moves between a
 * lit card and a flat one.
 *
 * The frame clips its own corners. The card must not, since clipping a view
 * on iOS also clips the shadow it throws, and the shadow is what sets a
 * night card off its ground.
 */
export function CardLight({ light, radius, borderWidth = 1 }: Props) {
    return (
        <View pointerEvents="none" style={ [styles.frame, inset(-borderWidth), { borderRadius: radius }] }>
            <LinearGradient
                colors={ light.rim.colors }
                locations={ light.rim.locations }
                start={ TOP_LEFT }
                end={ BOTTOM_RIGHT }
                style={ StyleSheet.absoluteFill }
            />
            <LinearGradient
                colors={ light.face.colors }
                locations={ light.face.locations }
                start={ TOP_LEFT }
                end={ BOTTOM_RIGHT }
                style={ [styles.face, inset(RIM_WIDTH), { borderRadius: radius - RIM_WIDTH }] }
            />
        </View>
    );
}

const inset = (by: number) => ({ top: by, left: by, right: by, bottom: by });

const styles = StyleSheet.create({
    frame: {
        position: 'absolute',
        overflow: 'hidden',
    },
    face: {
        position: 'absolute',
    },
});
