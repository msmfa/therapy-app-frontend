import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/theme';

type Props = {
    buttonSize: number;
    /** Defaults to the theme's glass rim; paper screens pass their ink. */
    color?: string;
    /** Scaled by the theme's rim strength, so the line dims with the glass at night. */
    opacity?: number;
};

// Breathing room between the button edge and the outline.
const PADDING = 2;

// Extra svg canvas so the outline is not clipped at the row's edges.
const INSET = 4;

// The tray outline from the product shot: a single fine line that hugs the two
// round buttons with a hair of padding, running straight along the top from one
// button to the other, wrapping around the far side of each button, and running
// straight back along the bottom to close the loop. Render it absolutely inside
// a row whose first and last children are the two buttons.
export function GlassButtonOutline({ buttonSize, color: colorProp, opacity = 0.28 }: Props) {
    const { theme } = useTheme();
    const color = colorProp ?? theme.glass.rim;
    const strokeOpacity = opacity * theme.glass.rimOpacity;
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
    };

    const { width, height } = layout;
    const buttonRadius = buttonSize / 2;
    const outlineRadius = buttonRadius + PADDING;

    const cy = INSET + height / 2;
    const leftCx = INSET + buttonRadius;
    const rightCx = INSET + width - buttonRadius;

    const path = [
        `M ${leftCx} ${cy - outlineRadius}`,
        `L ${rightCx} ${cy - outlineRadius}`,
        `A ${outlineRadius} ${outlineRadius} 0 0 1 ${rightCx} ${cy + outlineRadius}`,
        `L ${leftCx} ${cy + outlineRadius}`,
        `A ${outlineRadius} ${outlineRadius} 0 0 1 ${leftCx} ${cy - outlineRadius}`,
        'Z',
    ].join(' ');

    return (
        <View pointerEvents="none" style={ StyleSheet.absoluteFill } onLayout={ handleLayout }>
            { width > 0 && height > 0 ? (
                <Svg
                    width={ width + INSET * 2 }
                    height={ height + INSET * 2 }
                    style={ styles.canvas }
                >
                    <Path
                        d={ path }
                        stroke={ color }
                        strokeOpacity={ strokeOpacity }
                        strokeWidth={ 1 }
                        fill="none"
                    />
                </Svg>
            ) : null }
        </View>
    );
}

const styles = StyleSheet.create({
    canvas: {
        position: 'absolute',
        top: -INSET,
        left: -INSET,
    },
});
