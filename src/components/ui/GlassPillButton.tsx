import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Rect, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import AppText from './AppText';
import { PALETTE } from 'designs/designs-colors';

type Props = {
    label: string;
    height?: number;
    onPress: () => void;
    accessibilityLabel?: string;
    // White reads on the home screen's colour; paper screens pass their ink.
    labelColor?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

// The pill form of GlassCircleButton, built the same way: an almost clear
// blurred body, a bright specular edge along the top that fades around the
// shoulders, a fainter reflection along the bottom, and a shaded lower-right
// rim that gives the glass its thickness.
export function GlassPillButton({
    label,
    height = 48,
    onPress,
    accessibilityLabel,
    labelColor = '#ffffff',
    disabled = false,
    style,
}: Props) {
    const [width, setWidth] = React.useState(0);
    const radius = height / 2;

    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ 0.7 }
            accessibilityRole="button"
            accessibilityLabel={ accessibilityLabel ?? label }
            accessibilityState={ { disabled } }
            onLayout={ (event) => setWidth(event.nativeEvent.layout.width) }
            style={ [
                styles.shadowWrapper,
                { height, borderRadius: radius },
                disabled && styles.disabled,
                style,
            ] }
        >
            <BlurView
                intensity={ 46 }
                tint="light"
                style={ [styles.pill, { height, borderRadius: radius }] }
            >
                <LinearGradient
                    colors={ ['hsla(0, 0%, 100%, 0.42)', 'hsla(0, 0%, 100%, 0.08)'] }
                    style={ StyleSheet.absoluteFill }
                />
                <AppText variant="body" style={ [styles.label, { color: labelColor }] }>
                    { label }
                </AppText>
            </BlurView>
            { width > 0 ? (
                <View pointerEvents="none" style={ StyleSheet.absoluteFill }>
                    <Svg width={ width } height={ height }>
                        <Defs>
                            <SvgGradient id="pillRimShade" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#1b2a44" stopOpacity="0" />
                                <Stop offset="0.55" stopColor="#1b2a44" stopOpacity="0.06" />
                                <Stop offset="1" stopColor="#1b2a44" stopOpacity="0.22" />
                            </SvgGradient>
                            <SvgGradient id="pillSpec" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                                <Stop offset="0.35" stopColor="#ffffff" stopOpacity="0.3" />
                                <Stop offset="0.75" stopColor="#ffffff" stopOpacity="0.06" />
                                <Stop offset="1" stopColor="#ffffff" stopOpacity="0.38" />
                            </SvgGradient>
                        </Defs>
                        <Rect
                            x={ 0.8 }
                            y={ 0.8 }
                            width={ width - 1.6 }
                            height={ height - 1.6 }
                            rx={ radius }
                            stroke="url(#pillRimShade)"
                            strokeWidth={ 1.6 }
                            fill="none"
                        />
                        <Rect
                            x={ 1.2 }
                            y={ 1.2 }
                            width={ width - 2.4 }
                            height={ height - 2.4 }
                            rx={ radius }
                            stroke="url(#pillSpec)"
                            strokeWidth={ 1.6 }
                            fill="none"
                        />
                    </Svg>
                </View>
            ) : null }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    shadowWrapper: {
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 8,
    },
    pill: {
        overflow: 'hidden',
        paddingHorizontal: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 17,
    },
    disabled: {
        opacity: 0.5,
    },
});
