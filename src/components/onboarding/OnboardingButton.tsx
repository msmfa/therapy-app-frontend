import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { TEXT_COLORS } from 'designs/designs-colors';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';

type Props = {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    transparent?: boolean;
};

/** The app's glass action, with an in-flow label for longer onboarding CTAs. */
export function OnboardingButton({ label, onPress, disabled = false, loading = false, transparent = false }: Props) {
    if (!transparent) {
        return (
            <GlassPillButton
                label={ label }
                onPress={ onPress }
                disabled={ disabled }
                loading={ loading }
                contentSized
                height={ 60 }
                labelColor={ TEXT_COLORS.primary }
                disabledLabelColor={ TEXT_COLORS.secondary }
                style={ styles.primary }
            />
        );
    }

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
            { loading ? <ActivityIndicator color={ TEXT_COLORS.primary } /> : (
                <AppText variant="body" style={ styles.secondaryLabel }>{ label }</AppText>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryLabel: { color: TEXT_COLORS.primary, textAlign: 'center', textDecorationLine: 'underline' },
    disabled: { opacity: 0.5 },
});
