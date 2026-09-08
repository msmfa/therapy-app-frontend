import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { TEXT_COLORS } from 'designs/designs-colors';

/** A thin grey rule that keeps the same dots across native platforms. */
export function DottedDivider() {
    const [width, setWidth] = useState(0);

    return (
        <View
            style={ styles.divider }
            onLayout={ (event) => setWidth(event.nativeEvent.layout.width) }
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            { width > 0 && (
                <Svg width={ width } height={ 1 }>
                    <Line
                        x1={ 0 }
                        y1={ 0.5 }
                        x2={ width }
                        y2={ 0.5 }
                        stroke={ TEXT_COLORS.quaternary }
                        strokeWidth={ 1 }
                        strokeDasharray="1 4"
                        strokeLinecap="round"
                    />
                </Svg>
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    divider: {
        height: 1,
        alignSelf: 'stretch',
    },
});
