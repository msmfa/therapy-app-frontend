import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Path, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';

type Props = {
    onPress: () => void;
    accessibilityLabel: string;
    size?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

// Small svg bleed past the touch target so round line caps are not clipped.
const CANVAS_PAD = 4;

// A round thick-glass button in the style of the iOS focus-mode pills: an
// almost clear blurred body, a bright specular highlight running across the
// top edge and wrapping down around the shoulders, a fainter reflection along
// the bottom edge, a soft shadow that gives the glass its thickness, and a
// thin white plus.
export function GlassCircleButton({
    onPress,
    accessibilityLabel,
    size = 84,
    disabled = false,
    style,
}: Props) {
    const radius = size / 2;
    const canvasSize = size + CANVAS_PAD * 2;
    const center = CANVAS_PAD + radius;

    const plusArm = size * 0.21;

    // Specular arcs hug the rim; endpoints sit where the highlight has faded out.
    const arcRadius = radius - 1.4;
    const spreadX = arcRadius * 0.985;
    const riseY = arcRadius * 0.174;

    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ 0.7 }
            accessibilityRole="button"
            accessibilityLabel={ accessibilityLabel }
            accessibilityState={ { disabled } }
            style={ [
                styles.shadowWrapper,
                { width: size, height: size, borderRadius: radius },
                disabled && styles.disabled,
                style,
            ] }
        >
            <BlurView
                intensity={ 28 }
                tint="light"
                style={ [styles.circle, { borderRadius: radius }] }
            >
                <LinearGradient
                    colors={ [
                        PALETTE.overlay.whiteSoftTransparent,
                        COLOR_VARIANTS.transparent,
                    ] }
                    style={ StyleSheet.absoluteFill }
                />
            </BlurView>
            <View pointerEvents="none" style={ [styles.canvas, { top: -CANVAS_PAD, left: -CANVAS_PAD }] }>
                <Svg width={ canvasSize } height={ canvasSize }>
                    <Defs>
                        <SvgGradient id="specTop" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                            <Stop offset="0.2" stopColor="#ffffff" stopOpacity="0.55" />
                            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.95" />
                            <Stop offset="0.8" stopColor="#ffffff" stopOpacity="0.55" />
                            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                        </SvgGradient>
                        <SvgGradient id="specBottom" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.38" />
                            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                        </SvgGradient>
                    </Defs>
                    <Circle
                        cx={ center }
                        cy={ center }
                        r={ radius - 0.8 }
                        stroke="#ffffff"
                        strokeOpacity={ 0.22 }
                        strokeWidth={ 1 }
                        fill="none"
                    />
                    <Path
                        d={ `M ${center - spreadX} ${center - riseY} A ${arcRadius} ${arcRadius} 0 0 1 ${center + spreadX} ${center - riseY}` }
                        stroke="url(#specTop)"
                        strokeWidth={ 2.4 }
                        strokeLinecap="round"
                        fill="none"
                    />
                    <Path
                        d={ `M ${center - spreadX} ${center + riseY} A ${arcRadius} ${arcRadius} 0 0 0 ${center + spreadX} ${center + riseY}` }
                        stroke="url(#specBottom)"
                        strokeWidth={ 1.8 }
                        strokeLinecap="round"
                        fill="none"
                    />
                    <Line
                        x1={ center - plusArm }
                        y1={ center }
                        x2={ center + plusArm }
                        y2={ center }
                        stroke="#ffffff"
                        strokeWidth={ 2 }
                        strokeLinecap="round"
                    />
                    <Line
                        x1={ center }
                        y1={ center - plusArm }
                        x2={ center }
                        y2={ center + plusArm }
                        stroke="#ffffff"
                        strokeWidth={ 2 }
                        strokeLinecap="round"
                    />
                </Svg>
            </View>
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
    circle: {
        flex: 1,
        overflow: 'hidden',
    },
    canvas: {
        position: 'absolute',
    },
    disabled: {
        opacity: 0.5,
    },
});
