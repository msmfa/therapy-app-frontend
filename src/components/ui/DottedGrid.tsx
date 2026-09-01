import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type Props = {
    style?: StyleProp<ViewStyle>;
    /** Distance between grid lines, in points. */
    spacing?: number;
    color?: string;
};

const DEFAULT_SPACING = 120;
const DEFAULT_COLOR = 'hsla(0, 0%, 0%, 0.20)';

// Dot and gap along each line. A dash of 1 against a gap of 5 reads as dots
// rather than a broken rule.
const DASH = '1 5';

// Faint graph-paper ruling for a page that should read as a worksheet. Sits
// behind everything and never takes a touch.
export function DottedGrid({ style, spacing = DEFAULT_SPACING, color = DEFAULT_COLOR }: Props) {
    const { height, width } = useWindowDimensions();

    const columns = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    return (
        <View pointerEvents="none" style={ [styles.root, style] }>
            <Svg height={ height } width={ width }>
                { Array.from({ length: columns }, (_unused, index) => {
                    const x = (index + 1) * spacing;
                    return (
                        <Line
                            key={ `v${index}` }
                            stroke={ color }
                            strokeDasharray={ DASH }
                            strokeWidth={ 1 }
                            x1={ x }
                            x2={ x }
                            y1={ 0 }
                            y2={ height }
                        />
                    );
                }) }
                { Array.from({ length: rows }, (_unused, index) => {
                    const y = (index + 1) * spacing;
                    return (
                        <Line
                            key={ `h${index}` }
                            stroke={ color }
                            strokeDasharray={ DASH }
                            strokeWidth={ 1 }
                            x1={ 0 }
                            x2={ width }
                            y1={ y }
                            y2={ y }
                        />
                    );
                }) }
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
});
