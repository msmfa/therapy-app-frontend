import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Rect, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';
import { PALETTE } from 'designs/designs-colors';

type Props = {
    label: string;
    height?: number;
    /** Scales with `height` where the caller wants a larger pill. */
    labelSize?: number;
    onPress: () => void;
    accessibilityLabel?: string;
    // White reads on the home screen's colour; paper screens pass their ink.
    labelColor?: string;
    // When given, the disabled label takes this colour outright instead of the
    // default fade, so it can be dialled to a specific grey.
    disabledLabelColor?: string;
    disabled?: boolean;
    loading?: boolean;
    /** Let longer labels and accessibility text grow beyond the minimum height. */
    contentSized?: boolean;
    /**
     * Paints the pill in one flat colour instead of glass.
     *
     * Same geometry, shadow and label handling; the blur, the specular edge and
     * the rim shading are all dropped, since none of them describe anything on
     * an opaque surface.
     */
    fillColor?: string;
    style?: StyleProp<ViewStyle>;
};

/**
 * The clearance a shoulder keeps once it has given up the rest of its width.
 *
 * Past this the label has somewhere else to go: it shrinks itself, down to
 * `minimumFontScale`, and only then truncates. Losing a point of type is a
 * better trade than a label welded to the rim, and it is the order a pill
 * should degrade in.
 */
const MIN_SHOULDER = 12;

// The pill form of GlassCircleButton, built the same way: an almost clear
// blurred body, a bright specular edge along the top that fades around the
// shoulders, a fainter reflection along the bottom, and a shaded lower-right
// rim that gives the glass its thickness.
export function GlassPillButton({
    label,
    height = 48,
    labelSize = 17,
    onPress,
    accessibilityLabel,
    labelColor = '#ffffff',
    disabledLabelColor,
    disabled = false,
    loading = false,
    contentSized = false,
    fillColor,
    style,
}: Props) {
    const { t } = useTranslation('common');
    const resolvedLabelColor = disabled && disabledLabelColor ? disabledLabelColor : labelColor;
    const isSolid = fillColor !== undefined;
    // A blurred view over an opaque fill is a blur of nothing, and on Android it
    // is a real cost, so the solid form drops to a plain view.
    const Body = isSolid ? View : BlurView;
    const [layout, setLayout] = React.useState({ width: 0, height });
    const { width } = layout;
    const renderedHeight = contentSized ? layout.height : height;
    const radius = renderedHeight / 2;

    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled || loading }
            // The solid form dims further under the finger than the glass one:
            // glass already shifts as the blur moves, and a flat black pill has
            // nothing to show a press with except its own opacity.
            activeOpacity={ isSolid ? 0.6 : 0.7 }
            accessibilityRole="button"
            accessibilityLabel={ accessibilityLabel ?? label }
            accessibilityState={ { disabled: disabled || loading, busy: loading } }
            accessibilityValue={ loading ? { text: t('a11y.loading') } : undefined }
            onLayout={ (event) => setLayout(event.nativeEvent.layout) }
            style={ [
                styles.shadowWrapper,
                { ...(contentSized ? { minHeight: height } : { height }), borderRadius: radius },
                disabled && styles.disabled,
                style,
            ] }
        >
            <Body
                intensity={ 46 }
                tint="light"
                style={ [
                    styles.pill,
                    contentSized ? { minHeight: height, paddingVertical: 18 } : { height },
                    { borderRadius: radius },
                    isSolid && { backgroundColor: fillColor },
                ] }
            >
                { !isSolid && (
                    <LinearGradient
                        colors={ ['hsla(0, 0%, 100%, 0.42)', 'hsla(0, 0%, 100%, 0.08)'] }
                        style={ StyleSheet.absoluteFill }
                    />
                ) }
                { /* The 38pt shoulders used to be padding on the pill, which
                     cannot give way. A caller that fixes the pill's width
                     (the calendar footer pins it to 132) was therefore
                     handing the label 56pt, which "Clear" fits and
                     "Effacer" does not, so the label wrapped mid-word.
                     As flexible spacers they hold the same 38pt wherever
                     there is room, leaving the intrinsic width of every
                     content-sized pill unchanged, and give way down to
                     MIN_SHOULDER when the label needs it. */ }
                <View style={ styles.shoulder } />
                <AppText
                    variant="body"
                    numberOfLines={ 1 }
                    // The last resort, for a label longer than any pill: a
                    // pill is a single-line control, so shrinking the type
                    // beats wrapping or truncating it.
                    adjustsFontSizeToFit
                    minimumFontScale={ 0.8 }
                    style={ [
                        styles.label,
                        // `lineHeight` is cleared, not merely overridden. AppText's
                        // `body` variant carries `lineHeight: 24` for running text,
                        // and iOS lays a fixed line height out by putting all the
                        // spare leading above the glyphs, so a 16pt label inside a
                        // 24pt line box was drawn about 4pt below the middle of the
                        // pill. The pill centres a single line, so the font's own
                        // metrics are the ones that centre it; leaving it unset also
                        // keeps the label centred when `adjustsFontSizeToFit` shrinks
                        // a long translation, which a fixed line height would not.
                        { color: resolvedLabelColor, fontSize: labelSize, lineHeight: undefined },
                        disabled && !disabledLabelColor && styles.disabledLabel,
                        contentSized && styles.contentSizedLabel,
                        loading && styles.hiddenLabel,
                    ] }
                >
                    { label }
                </AppText>
                <View style={ styles.shoulder } />
                { loading && <ActivityIndicator color={ resolvedLabelColor } style={ StyleSheet.absoluteFill } /> }
            </Body>
            { width > 0 && !isSolid ? (
                <View pointerEvents="none" style={ StyleSheet.absoluteFill }>
                    <Svg width={ width } height={ renderedHeight }>
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
                            height={ renderedHeight - 1.6 }
                            rx={ radius }
                            stroke="url(#pillRimShade)"
                            strokeWidth={ 1.6 }
                            fill="none"
                        />
                        <Rect
                            x={ 1.2 }
                            y={ 1.2 }
                            width={ width - 2.4 }
                            height={ renderedHeight - 2.4 }
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 38pt where there is room, and it gives way where there is not, but never
    // all the way. `flexShrink` with no floor takes a shoulder to zero, and at
    // zero the label is flush against the tip of the rounded cap: the widest
    // point of the curve sits at the label's vertical centre, so the first and
    // last glyph touch the rim. English never reached that, because the labels
    // that share a pill with a fixed width are short ones; "Clear" fits the
    // 56pt the calendar footer leaves and "Zurücksetzen" is twice that.
    shoulder: {
        width: 38,
        flexShrink: 1,
        minWidth: MIN_SHOULDER,
    },
    label: {
        fontSize: 17,
        letterSpacing: 1.2,
        flexShrink: 1,
        // Without this a flex child will not shrink below its content width,
        // which is the whole point of the shoulders giving way.
        minWidth: 0,
        textAlign: 'center',
    },
    contentSizedLabel: {
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    hiddenLabel: {
        opacity: 0,
    },
    disabled: {
        opacity: 0.6,
    },
    // The glass itself stays readable when disabled; the label is what carries
    // the "nothing to do here" signal, so it fades further than the pill does.
    disabledLabel: {
        opacity: 0.55,
    },
});
