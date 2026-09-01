import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

// The chart the page sits on: dashed horizontal rules, a stepped trace with
// a marker at its start, and the week along the bottom. Everything is a tone
// of grey a few steps off white, so it reads as ruled paper behind the cards
// rather than as a chart of its own.
const RULE_COLOR = 'hsl(0, 0%, 92%)';
const TRACE_COLOR = 'hsl(0, 0%, 90%)';
const MARKER_COLOR = 'hsl(0, 0%, 87%)';
const LABEL_COLOR = 'hsl(0, 0%, 86%)';

const RULE_SPACING = 88;
const RULE_DASH = '8 7';

// The whole chart is tilted, rising to the right. The canvas is drawn larger
// than the screen and centred on it so the rotation cannot pull an empty
// corner into view.
const TILT = '-6deg';
const OVERHANG_X = 130;
const OVERHANG_Y = 100;

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const LABEL_SIZE = 15;
/** Where the week sits, as a share of the height. */
const LABEL_BASELINE = 0.88;

// The trace, as shares of the screen: a low run, a ramp up, a high run, a ramp
// back down. The ramps are cubics rather than corners, the way the reference
// draws them.
const TRACE_LOW = 0.34;
const TRACE_HIGH = 0.19;
const RAMP_UP_START = 0.2;
const RAMP_UP_END = 0.34;
const RAMP_DOWN_START = 0.64;
const RAMP_DOWN_END = 0.78;
const MARKER_X = 0.06;
const MARKER_RADIUS = 5;

export function ChartBackground() {
    const { width, height } = useWindowDimensions();

    const canvasWidth = width + OVERHANG_X * 2;
    const canvasHeight = height + OVERHANG_Y * 2;

    // The trace and the week are placed against the screen, then shifted into
    // the larger canvas, so the tilt turns the composition rather than moving
    // it.
    const low = OVERHANG_Y + height * TRACE_LOW;
    const high = OVERHANG_Y + height * TRACE_HIGH;
    const rampUpStart = OVERHANG_X + width * RAMP_UP_START;
    const rampUpEnd = OVERHANG_X + width * RAMP_UP_END;
    const rampDownStart = OVERHANG_X + width * RAMP_DOWN_START;
    const rampDownEnd = OVERHANG_X + width * RAMP_DOWN_END;
    const upEase = (rampUpEnd - rampUpStart) / 2;
    const downEase = (rampDownEnd - rampDownStart) / 2;

    const trace = [
        `M 0 ${low}`,
        `L ${rampUpStart} ${low}`,
        `C ${rampUpStart + upEase} ${low}, ${rampUpEnd - upEase} ${high}, ${rampUpEnd} ${high}`,
        `L ${rampDownStart} ${high}`,
        `C ${rampDownStart + downEase} ${high}, ${rampDownEnd - downEase} ${low}, ${rampDownEnd} ${low}`,
        `L ${canvasWidth} ${low}`,
    ].join(' ');

    const rules = Math.floor(canvasHeight / RULE_SPACING);

    return (
        <Svg
            pointerEvents="none"
            width={ canvasWidth }
            height={ canvasHeight }
            style={ [styles.canvas, { left: -OVERHANG_X, top: -OVERHANG_Y }] }
        >
            { Array.from({ length: rules }, (_, index) => {
                const y = (index + 1) * RULE_SPACING;

                return (
                    <Line
                        key={ index }
                        x1={ 0 }
                        y1={ y }
                        x2={ canvasWidth }
                        y2={ y }
                        stroke={ RULE_COLOR }
                        strokeWidth={ 1 }
                        strokeDasharray={ RULE_DASH }
                    />
                );
            }) }

            <Path d={ trace } stroke={ TRACE_COLOR } strokeWidth={ 2 } fill="none" />
            <Circle cx={ OVERHANG_X + width * MARKER_X } cy={ low } r={ MARKER_RADIUS } fill={ MARKER_COLOR } />

            { DAYS.map((day, index) => (
                <SvgText
                    key={ day }
                    x={ OVERHANG_X + (width * (index + 0.5)) / DAYS.length }
                    y={ OVERHANG_Y + height * LABEL_BASELINE }
                    fill={ LABEL_COLOR }
                    fontSize={ LABEL_SIZE }
                    fontStyle="italic"
                    textAnchor="middle"
                >
                    { day }
                </SvgText>
            )) }
        </Svg>
    );
}

const styles = StyleSheet.create({
    canvas: {
        position: 'absolute',
        transform: [{ rotate: TILT }],
    },
});
