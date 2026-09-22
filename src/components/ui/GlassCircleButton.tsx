import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Path, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

export type GlassCircleIcon = 'plus' | 'question' | 'back' | 'forward' | 'close';

type Props = {
    onPress: () => void;
    accessibilityLabel: string;
    icon?: GlassCircleIcon;
    // White reads on the home screen's colour; paper screens pass their ink.
    iconColor?: string;
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
    icon = 'plus',
    iconColor = '#ffffff',
    size = 84,
    disabled = false,
    style,
}: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { rim, rimOpacity, shade } = theme.glass;
    const markColor = disabled ? theme.glass.disabledLabel : iconColor;
    const radius = size / 2;
    const canvasSize = size + CANVAS_PAD * 2;
    const center = CANVAS_PAD + radius;

    const plusArm = size * 0.21;

    // The diagonal reads longer than the plus at the same arm, so it sits shorter.
    const arrowArm = size * 0.155;
    // Back runs straight across, so it has none of the diagonal's extra length
    // to give back and is set nearer the plus.
    const backArm = size * 0.2;
    /** The chevron's own reach, back along the shaft and out to each side. */
    const backHead = size * 0.105;
    const closeArm = size * 0.16;

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
                intensity={ 46 }
                tint={ theme.glass.tint }
                style={ [styles.circle, { borderRadius: radius }] }
            >
                <LinearGradient
                    colors={ theme.glass.highlight }
                    style={ StyleSheet.absoluteFill }
                />
            </BlurView>
            <View pointerEvents="none" style={ [styles.canvas, { top: -CANVAS_PAD, left: -CANVAS_PAD }] }>
                <Svg width={ canvasSize } height={ canvasSize }>
                    <Defs>
                        <SvgGradient id="specTop" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor={ rim } stopOpacity="0" />
                            <Stop offset="0.2" stopColor={ rim } stopOpacity={ 0.55 * rimOpacity } />
                            <Stop offset="0.5" stopColor={ rim } stopOpacity={ 0.95 * rimOpacity } />
                            <Stop offset="0.8" stopColor={ rim } stopOpacity={ 0.55 * rimOpacity } />
                            <Stop offset="1" stopColor={ rim } stopOpacity="0" />
                        </SvgGradient>
                        <SvgGradient id="rimShade" x1="0" y1="0" x2="1" y2="1">
                            <Stop offset="0" stopColor={ shade } stopOpacity="0" />
                            <Stop offset="0.55" stopColor={ shade } stopOpacity="0.06" />
                            <Stop offset="1" stopColor={ shade } stopOpacity="0.22" />
                        </SvgGradient>
                        <SvgGradient id="specBottom" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor={ rim } stopOpacity="0" />
                            <Stop offset="0.5" stopColor={ rim } stopOpacity={ 0.38 * rimOpacity } />
                            <Stop offset="1" stopColor={ rim } stopOpacity="0" />
                        </SvgGradient>
                    </Defs>
                    <Circle
                        cx={ center }
                        cy={ center }
                        r={ radius - 0.8 }
                        stroke="url(#rimShade)"
                        strokeWidth={ 1.6 }
                        fill="none"
                    />
                    <Circle
                        cx={ center }
                        cy={ center }
                        r={ radius - 0.8 }
                        stroke={ rim }
                        strokeOpacity={ 0.3 * rimOpacity }
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
                    { icon === 'forward' ? (
                        <>
                            <Path
                                d={ `M ${center - arrowArm} ${center + arrowArm} L ${center + arrowArm} ${center - arrowArm}` }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                                fill="none"
                            />
                            <Path
                                d={ `M ${center + arrowArm - arrowArm * 1.05} ${center - arrowArm} L ${center + arrowArm} ${center - arrowArm} L ${center + arrowArm} ${center - arrowArm + arrowArm * 1.05}` }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </>
                    ) : icon === 'back' ? (
                        /* Straight back along the axis the screen leaves on. The
                           arrow used to point up and to the left, which read as
                           a diagonal move to somewhere above rather than a step
                           back through the flow. */
                        <>
                            <Path
                                d={ `M ${center + backArm} ${center} L ${center - backArm} ${center}` }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                                fill="none"
                            />
                            <Path
                                d={ `M ${center - backArm + backHead} ${center - backHead} L ${center - backArm} ${center} L ${center - backArm + backHead} ${center + backHead}` }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </>
                    ) : icon === 'close' ? (
                        <>
                            <Line
                                x1={ center - closeArm }
                                y1={ center - closeArm }
                                x2={ center + closeArm }
                                y2={ center + closeArm }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                            />
                            <Line
                                x1={ center + closeArm }
                                y1={ center - closeArm }
                                x2={ center - closeArm }
                                y2={ center + closeArm }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                            />
                        </>
                    ) : icon === 'plus' ? (
                        <>
                            <Line
                                x1={ center - plusArm }
                                y1={ center }
                                x2={ center + plusArm }
                                y2={ center }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                            />
                            <Line
                                x1={ center }
                                y1={ center - plusArm }
                                x2={ center }
                                y2={ center + plusArm }
                                stroke={ markColor }
                                strokeWidth={ 2 }
                                strokeLinecap="round"
                            />
                        </>
                    ) : (
                        <SvgText
                            x={ center }
                            y={ center + size * 0.15 }
                            fill={ markColor }
                            fontSize={ size * 0.42 }
                            fontWeight="300"
                            textAnchor="middle"
                        >
                            ?
                        </SvgText>
                    ) }
                </Svg>
            </View>
        </TouchableOpacity>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    shadowWrapper: {
        shadowColor: theme.shadow,
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
    // Faint enough that a plus with nothing to save is plainly not a button
    // yet. At half opacity the two states were near enough to be missed.
    disabled: {
        opacity: 0.3,
    },
});
