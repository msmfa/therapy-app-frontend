import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Theme } from 'designs/designs-themes';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { useTheme, useThemedStyles } from '../../context/theme';
import { useOnboardingStyles } from './onboardingStyles';

type Props = {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    transparent?: boolean;
    /**
     * The ground the button sits on. The glass pill is near-clear, so its label
     * has to take the surface's ink: the page's ink on the pale ground, white on
     * the accent.
     */
    surface?: 'light' | 'accent';
    /**
     * `glass` is the flow's usual action, made of the same material as the
     * page. `solid` is the ground's opposite by day, for the moments that
     * start something rather than continue it; the theme may fold it back
     * into glass, as the night does. `ink` is the ground's opposite in every
     * theme, for an action that has to stay a dark block at night. `start` is
     * the one action that opens the flow: black by day like `solid`, the
     * plan's orange with a lit edge at night.
     */
    appearance?: 'glass' | 'solid' | 'ink' | 'start';
};

/**
 * The app's glass action, with an in-flow label for longer onboarding CTAs.
 *
 * The transparent variant is a secondary action drawn as text, so it takes the
 * same appearance as every other link in the flow: bold link colour, a
 * trailing arrow, no underline.
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
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { onboardingStyles, linkColor: pageLinkColor } = useOnboardingStyles();
    const isAccent = surface === 'accent';

    if (!transparent) {
        const isStart = appearance === 'start';
        const isSolid = appearance === 'ink' || (appearance === 'solid' && theme.solid.flowAction === 'solid');
        const isFilled = isStart || isSolid;

        return (
            <GlassPillButton
                label={ label }
                onPress={ onPress }
                disabled={ disabled }
                loading={ loading }
                contentSized
                height={ 60 }
                fillColor={ isStart ? theme.solid.start.background : isSolid ? theme.solid.background : undefined }
                rim={ isStart ? theme.solid.start.rim : undefined }
                labelColor={
                    isStart
                        ? theme.solid.start.text
                        : isSolid
                            ? theme.solid.text
                            : isAccent ? theme.accentScreen.textPrimary : theme.ink.primary
                }
                disabledLabelColor={
                    isFilled
                        ? theme.solid.disabledText
                        : isAccent ? theme.accentScreen.textSecondary : theme.ink.secondary
                }
                style={ styles.primary }
            />
        );
    }

    // The link colour is pitched for the pale ground and unreadable on the
    // accent, where white carries the same job.
    const linkColor = isAccent ? theme.accentScreen.textPrimary : pageLinkColor;

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

const makeStyles = (theme: Theme) => StyleSheet.create({
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
    accentLinkLabel: { color: theme.accentScreen.textPrimary },
    disabled: { opacity: 0.5 },
});
