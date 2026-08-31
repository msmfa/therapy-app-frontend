import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { PALETTE } from 'designs/designs-colors';

type Props = {
    onPress: () => void;
    accessibilityLabel: string;
    size?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

// How far the svg canvas extends past the touch target, so the companion
// bubble can overlap the button edge without being clipped.
const CANVAS_PAD = 14;

// A round frosted-glass button modelled on the product shot: a blurred
// translucent fill, a rim that fades from bright at the top left to almost
// nothing at the bottom right, a second bubble outline overlapping it like
// touching soap bubbles, and a thin white plus.
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

    // Companion bubble: slightly larger, drifted up and to the left, so the
    // two rims run close together at the top left the way they do in the shot.
    const haloRadius = radius + 2;
    const haloCenterX = center - 3;
    const haloCenterY = center - 3.5;

    const plusArm = size * 0.21;

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
                        PALETTE.overlay.whiteMediumTransparent,
                        PALETTE.overlay.whiteSoftTransparent,
                    ] }
                    style={ StyleSheet.absoluteFill }
                />
            </BlurView>
            <View pointerEvents="none" style={ [styles.canvas, { top: -CANVAS_PAD, left: -CANVAS_PAD }] }>
                <Svg width={ canvasSize } height={ canvasSize }>
                    <Defs>
                        <SvgGradient id="rim" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                            <Stop offset="0.55" stopColor="#ffffff" stopOpacity="0.35" />
                            <Stop offset="1" stopColor="#ffffff" stopOpacity="0.06" />
                        </SvgGradient>
                        <SvgGradient id="haloRim" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
                            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.18" />
                            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                        </SvgGradient>
                    </Defs>
                    <Circle
                        cx={ haloCenterX }
                        cy={ haloCenterY }
                        r={ haloRadius }
                        stroke="url(#haloRim)"
                        strokeWidth={ 1.2 }
                        fill="none"
                    />
                    <Circle
                        cx={ center }
                        cy={ center }
                        r={ radius - 0.8 }
                        stroke="url(#rim)"
                        strokeWidth={ 1.6 }
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
        shadowColor: PALETTE.overlay.roseShadowTransparent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
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
