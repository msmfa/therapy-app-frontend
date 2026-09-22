import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useTheme } from '../../context/theme';

/** A thin grey rule that keeps the same dots across native platforms. */
export function DottedDivider({ style }: { style?: StyleProp<ViewStyle> }) {
    const { theme } = useTheme();
    const [width, setWidth] = useState(0);

    return (
        <View
            style={ [styles.divider, style] }
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
                        stroke={ theme.ink.quaternary }
                        strokeOpacity={ 0.45 }
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
