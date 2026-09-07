import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
    ACCENT_SURFACE,
    COLOR_VARIANTS,
    PALETTE,
    TEXT_COLORS,
} from 'designs/designs-colors';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { onboardingStyles, ONBOARDING_LINK_COLOR } from './onboardingStyles';

type Props = {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    transparent?: boolean;
    /**
     * The ground the button sits on. The glass pill is near-clear, so its label
     * has to take the surface's ink: near-black on the pale ground, white on
     * the accent.
     */
    surface?: 'light' | 'accent';
    /**
     * `glass` is the flow's usual action, made of the same material as the
     * page. `solid` is black with light grey on it, for the two moments that
     * start something rather than continue it.
     */
    appearance?: 'glass' | 'solid';
};

/**
 * The app's glass action, with an in-flow label for longer onboarding CTAs.
 *
 * The transparent variant is a secondary action drawn as text, so it takes the
 * same appearance as every other link in the flow: bold deep blue, a trailing
 * arrow, no underline.
 */
export function OnboardingButton({
    label,
    onPress,
    disabled = false,
    loading = false,
    transparent = false,
    surface = 'light',
    appearance = 'glass',
}: Props) {
    const isAccent = surface === 'accent';

    if (!transparent) {
        const isSolid = appearance === 'solid';

        return (
            <GlassPillButton
                label={ label }
                onPress={ onPress }
                disabled={ disabled }
                loading={ loading }
                contentSized
                height={ 60 }
                fillColor={ isSolid ? PALETTE.neutral.black : undefined }
                labelColor={
                    isSolid
                        ? COLOR_VARIANTS.white.quaternary
                        : isAccent ? ACCENT_SURFACE.textPrimary : TEXT_COLORS.primary
                }
                disabledLabelColor={
                    isSolid
                        ? COLOR_VARIANTS.black.quaternary
                        : isAccent ? ACCENT_SURFACE.textSecondary : TEXT_COLORS.secondary
                }
                style={ styles.primary }
            />
        );
    }

    // Deep blue is a link on the pale ground and unreadable on the accent,
    // where white carries the same job.
    const linkColor = isAccent ? ACCENT_SURFACE.textPrimary : ONBOARDING_LINK_COLOR;

    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled || loading }
            activeOpacity={ 0.7 }
            accessibilityRole="button"
            accessibilityLabel={ label }
            accessibilityState={ { disabled: disabled || loading, busy: loading } }
            accessibilityValue={ loading ? { text: 'Loading' } : undefined }
            style={ [styles.secondary, disabled && styles.disabled] }
        >
            { loading ? <ActivityIndicator color={ linkColor } /> : (
                <>
                    <AppText variant="body" style={ [onboardingStyles.linkLabel, styles.secondaryLabel, isAccent && styles.accentLinkLabel] }>
                        { label }
                    </AppText>
                    <Feather
                        name="arrow-right"
                        size={ 18 }
                        color={ linkColor }
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                </>
            ) }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    primary: { width: '100%' },
    secondary: {
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryLabel: { flexShrink: 1, textAlign: 'center' },
    accentLinkLabel: { color: ACCENT_SURFACE.textPrimary },
    disabled: { opacity: 0.5 },
});
