import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';

type Props = {
    onPress: () => void;
    accessibilityLabel: string;
    icon?: keyof typeof Feather.glyphMap;
    size?: number;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
};

// A round frosted-glass button: blurred translucent fill, a soft white rim,
// and a sheen that is brighter at the top so the circle reads as curved glass.
export function GlassCircleButton({
    onPress,
    accessibilityLabel,
    icon = 'plus',
    size = 84,
    disabled = false,
    style,
}: Props) {
    const radius = size / 2;

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
                <Feather
                    name={ icon }
                    size={ size * 0.4 }
                    color={ COLOR_VARIANTS.white.primary }
                />
            </BlurView>
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
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: PALETTE.overlay.whiteSurfaceTransparent,
    },
    disabled: {
        opacity: 0.5,
    },
});
