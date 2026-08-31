import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
    buttonSize: number;
};

// Extra svg canvas around the row so the wrap arcs are not clipped at the edges.
const INSET = 14;

// How far outside the button rim the wrap line runs.
const RING_GAP = 6;

// The decorative thread from the product shot: a very light line that runs
// across the row at the height of the buttons' upper edge and, where it meets
// a button, leaves the straight line and wraps the long way around it before
// carrying on. Render it absolutely inside a row whose first and last children
// are the two buttons.
export function GlassButtonTrack({ buttonSize }: Props) {
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
    };

    const { width, height } = layout;
    const buttonRadius = buttonSize / 2;
    const ringRadius = buttonRadius + RING_GAP;

    // The straight line sits high on the ring; the chord where it meets each
    // ring decides where the wrap begins and ends.
    const lineRise = ringRadius * 0.78;
    const halfChord = Math.sqrt(ringRadius * ringRadius - lineRise * lineRise);

    const cy = INSET + height / 2;
    const lineY = cy - lineRise;
    const leftCx = INSET + buttonRadius;
    const rightCx = INSET + width - buttonRadius;

    const path = [
        `M 0 ${lineY}`,
        `L ${leftCx - halfChord} ${lineY}`,
        `A ${ringRadius} ${ringRadius} 0 1 0 ${leftCx + halfChord} ${lineY}`,
        `L ${rightCx - halfChord} ${lineY}`,
        `A ${ringRadius} ${ringRadius} 0 1 0 ${rightCx + halfChord} ${lineY}`,
        `L ${width + INSET * 2} ${lineY}`,
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
                        stroke="#ffffff"
                        strokeOpacity={ 0.4 }
                        strokeWidth={ 1.2 }
                        strokeLinecap="round"
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
