import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

// The pill form of GlassCircleButton: the same clear blurred body, bright top
// rim and shaded lower edge, sized to a word instead of an icon.
export function GlassPillButton({
    label,
    height = 48,
    onPress,
    accessibilityLabel,
    labelColor = '#ffffff',
    disabled = false,
    style,
}: Props) {
    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ 0.7 }
            accessibilityRole="button"
            accessibilityLabel={ accessibilityLabel ?? label }
            accessibilityState={ { disabled } }
            style={ [styles.shadowWrapper, { height, borderRadius: height / 2 }, disabled && styles.disabled, style] }
        >
            <BlurView intensity={ 46 } tint="light" style={ [styles.pill, { height, borderRadius: height / 2 }] }>
                <LinearGradient
                    colors={ ['hsla(0, 0%, 100%, 0.42)', 'hsla(0, 0%, 100%, 0.08)'] }
                    style={ StyleSheet.absoluteFill }
                />
                <AppText variant="body" style={ [styles.label, { color: labelColor }] }>
                    { label }
                </AppText>
            </BlurView>
            { /* Drawn over the blur so the lit top edge is not washed out by it. */ }
            <View pointerEvents="none" style={ [styles.rim, { borderRadius: height / 2 }] } />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    shadowWrapper: {
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        elevation: 6,
    },
    pill: {
        overflow: 'hidden',
        paddingHorizontal: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rim: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1,
        borderColor: 'hsla(0, 0%, 100%, 0.55)',
    },
    label: {
        fontSize: 17,
    },
    disabled: {
        opacity: 0.5,
    },
});
