import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../context/theme';

type Props = {
    width?: number;
    height?: number;
    color?: string;
};

/**
 * A hand-drawn curve from a label down to whatever it is pointing at.
 *
 * Sweeps out to the right and back in, so it reads as a pen stroke made after
 * the fact rather than a rule in the layout. Purely decorative: the label it
 * sits beside carries the meaning, and the whole thing is inside one accessible
 * control, so this is hidden from assistive technology by its parent.
 */
export function CurvedArrow({ width = 64, height = 56, color: colorProp }: Props) {
    const { theme } = useTheme();
    const color = colorProp ?? theme.ink.tertiary;
    return (
        <Svg width={ width } height={ height } viewBox="0 0 64 56" fill="none">
            { /* Start under the label, bow right, finish pointing down-left. */ }
            <Path
                d="M6 6 C 34 2, 60 14, 52 36 C 48 46, 38 50, 28 48"
                stroke={ color }
                strokeWidth={ 2.4 }
                strokeLinecap="round"
                fill="none"
            />
            { /* The head, drawn as two strokes off the curve's last point. */ }
            <Path
                d="M36 42 L 27 48.4 L 34 53"
                stroke={ color }
                strokeWidth={ 2.4 }
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </Svg>
    );
}
