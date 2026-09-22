import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp, ActivityIndicator, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../constants';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

interface Props {
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    transparent?: boolean;
    addedStyles?: StyleProp<ViewStyle>;
    loading?: boolean;
    onPress: () => void;
}

export function Button({
    label,
    icon,
    onPress,
    disabled = false,
    transparent = false,
    addedStyles,
    loading = false,
}: Props) {
    const { t } = useTranslation('common');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const isDisabled = disabled || loading;
    const showDisabledStyles = disabled && !loading;

    // The solid pill is the ground's opposite: black with light type by day,
    // light with dark type at night. The transparent one is outlined in the
    // page's own ink.
    const baseTextColor = transparent ? theme.ink.primary : theme.solid.text;
    const textColor = showDisabledStyles ? theme.solid.disabledText : baseTextColor;
    const spinnerColor = loading ? baseTextColor : textColor;

    return (
        <TouchableOpacity
            style={ [
                styles.actionButton,
                transparent && !showDisabledStyles && styles.actionButtonTransparent,
                showDisabledStyles && styles.actionButtonDisabled,
                addedStyles && addedStyles,
            ] }
            onPress={ onPress }
            disabled={ isDisabled }
            activeOpacity={ isDisabled ? 1 : 0.8 }
            accessibilityRole="button"
            // `busy` is what tells VoiceOver the tap was heard and something is
            // happening; without it a loading button is only announced as
            // dimmed, which reads as "unavailable" rather than "working".
            accessibilityState={ { disabled: isDisabled, busy: loading } }
            accessibilityLabel={ label }
            accessibilityValue={ loading ? { text: t('a11y.loading') } : undefined }
        >
            { loading ? (
                <ActivityIndicator color={ spinnerColor } />
            ) : icon ? (
                <View style={ styles.iconWrapper }>{ icon }</View>
            ) : null }
            { !loading ? (
                <Text
                    style={ { color: textColor } }
                >
                    { label }
                </Text>
            ) : null }
        </TouchableOpacity>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 44,
        width: '100%',
        borderColor: theme.solid.background,
        backgroundColor: theme.solid.background,
    },
    actionButtonTransparent: {
        backgroundColor: 'transparent',
        borderColor: theme.ink.primary,
    },
    actionButtonDisabled: {
        backgroundColor: theme.solid.disabledSurface,
        borderColor: theme.solid.disabledBorder,
    },
    iconWrapper: {
        marginRight: spacing.sm,
    },
});
