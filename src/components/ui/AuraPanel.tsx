import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, {
    Circle,
    Defs,
    LinearGradient as SvgLinearGradient,
    RadialGradient,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';

import { DOT_COLS, DOT_ROWS, glyphCells } from './dotMatrixFont';

type Props = {
    /** Rendered as dots on the 5x7 lattice. Digits, letters and a few marks. */
    text: string;
    /** Optional line under the dots, in the design's caption style. */
    caption?: string;
    /**
     * Overrides the colour of the glow's core - the inner quarter of its
     * radius. The rest of the falloff is unchanged, so the glow still lands on
     * the same ground.
     */
    coreColor?: string;
    width: number;
    height: number;
    style?: StyleProp<ViewStyle>;
};

// Measured off the design, along the vertical centre line where the falloff is
// clean: the glow's colour at each fraction of its radius.
const GLOW_STOPS: { offset: number; color: string; opacity: number }[] = [
    { offset: 0, color: 'rgb(237,135,55)', opacity: 1 },
    { offset: 0.25, color: 'rgb(227,143,63)', opacity: 1 },
    { offset: 0.52, color: 'rgb(215,156,108)', opacity: 1 },
    { offset: 0.78, color: 'rgb(196,175,168)', opacity: 0.95 },
    { offset: 0.92, color: 'rgb(194,186,184)', opacity: 0.8 },
    { offset: 1, color: 'rgb(196,196,200)', opacity: 0 },
];

// The cool ground the glow sits on, taken from the design's corners.
const [GROUND_TOP, GROUND_MID, GROUND_BOTTOM] = ['rgb(197,204,213)', 'rgb(190,195,203)', 'rgb(197,200,207)'];

// The glow is centred right of the middle and reaches further sideways than it
// does up and down.
const GLOW_CX = 0.56;
const GLOW_CY = 0.5;
const GLOW_RX = 0.72;
const GLOW_RY = 0.5;

const DOT_COLOR = 'rgb(255,255,255)';

// All taken off the design. How big a glyph is measures against the panel's
// width - it is how much of the line the numerals take up - while where it
// sits measures against the height. At the design's own proportions the two
// are interchangeable, and these are the design's numbers either way; keeping
// them apart is what lets a panel of another shape stay faithful instead of
// shrinking its numerals along with its height.
//   an isolated dot measures 8px across a 12.75px pitch;
//   the seven dot rows span 9% of the design's height;
//   the caption's cap height is 16px;
//   its baseline sits 42px below the last row of dots.
const PITCH_RATIO = 0.02265;
const DOT_RADIUS_RATIO = 0.314;
const LETTER_GAP_COLS = 1;
const DOTS_CENTRE_RATIO = 0.452;
const CAPTION_SIZE_RATIO = 0.03926;
const CAPTION_BASELINE_RATIO = 0.1057;

// Svg text does not wrap, so a caption long enough to run past the panel is
// broken into lines here. The break is on an estimate of the face's advance
// width rather than a measurement, which is close enough for a caption that
// only has to stay inside the panel.
const CAPTION_LINE_HEIGHT = 1.3;
const CAPTION_CHAR_WIDTH = 0.52;
const CAPTION_MAX_WIDTH = 0.86;

function wrapCaption(caption: string, maxCharacters: number): string[] {
    const lines: string[] = [];
    let line = '';

    caption.split(' ').forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && candidate.length > maxCharacters) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    });

    if (line) {
        lines.push(line);
    }

    return lines;
}

// Measured white, faintly warm, and a touch soft against the glow behind it.
const CAPTION_COLOR = 'rgb(255,254,242)';
const CAPTION_OPACITY = 0.92;

export function AuraPanel({ text, caption, coreColor, width, height, style }: Props) {
    const glowStops = coreColor
        ? GLOW_STOPS.map((stop) => (stop.offset <= 0.25 ? { ...stop, color: coreColor } : stop))
        : GLOW_STOPS;

    const pitch = width * PITCH_RATIO;
    const radius = pitch * DOT_RADIUS_RATIO;

    const captionSize = width * CAPTION_SIZE_RATIO;
    const captionLines = caption
        ? wrapCaption(caption, Math.max(1, Math.floor(
            (width * CAPTION_MAX_WIDTH) / (captionSize * CAPTION_CHAR_WIDTH),
        )))
        : [];

    const characters = text.split('');
    const gridWidth = characters.length * DOT_COLS
        + Math.max(0, characters.length - 1) * LETTER_GAP_COLS;

    // Centre the block of dots, then walk the characters across it. The block
    // sits a little above the middle, where the design puts it.
    const originX = (width - (gridWidth - 1) * pitch) / 2;
    const originY = height * DOTS_CENTRE_RATIO - ((DOT_ROWS - 1) * pitch) / 2;
    const lastRowY = originY + (DOT_ROWS - 1) * pitch;

    const dots: { x: number; y: number; key: string }[] = [];
    characters.forEach((character, index) => {
        const columnOffset = index * (DOT_COLS + LETTER_GAP_COLS);
        glyphCells(character).forEach(([column, row]) => {
            dots.push({
                key: `${index}-${column}-${row}`,
                x: originX + (columnOffset + column) * pitch,
                y: originY + row * pitch,
            });
        });
    });

    return (
        <View style={ style }>
            <Svg width={ width } height={ height }>
                <Defs>
                    <SvgLinearGradient id="auraGround" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={ GROUND_TOP } />
                        <Stop offset="0.5" stopColor={ GROUND_MID } />
                        <Stop offset="1" stopColor={ GROUND_BOTTOM } />
                    </SvgLinearGradient>
                    <RadialGradient
                        id="auraGlow"
                        cx={ `${GLOW_CX * 100}%` }
                        cy={ `${GLOW_CY * 100}%` }
                        rx={ `${GLOW_RX * 100}%` }
                        ry={ `${GLOW_RY * 100}%` }
                    >
                        { glowStops.map((stop) => (
                            <Stop
                                key={ stop.offset }
                                offset={ stop.offset }
                                stopColor={ stop.color }
                                stopOpacity={ stop.opacity }
                            />
                        )) }
                    </RadialGradient>
                </Defs>

                <Rect x={ 0 } y={ 0 } width={ width } height={ height } fill="url(#auraGround)" />
                <Rect x={ 0 } y={ 0 } width={ width } height={ height } fill="url(#auraGlow)" />

                { dots.map((dot) => (
                    <Circle key={ dot.key } cx={ dot.x } cy={ dot.y } r={ radius } fill={ DOT_COLOR } />
                )) }

                { captionLines.map((line, index) => (
                    <SvgText
                        key={ index }
                        x={ width / 2 }
                        y={ lastRowY + width * CAPTION_BASELINE_RATIO
                            + index * captionSize * CAPTION_LINE_HEIGHT }
                        fill={ CAPTION_COLOR }
                        fillOpacity={ CAPTION_OPACITY }
                        fontSize={ captionSize }
                        fontWeight="400"
                        textAnchor="middle"
                    >
                        { line }
                    </SvgText>
                )) }
            </Svg>
        </View>
    );
}
