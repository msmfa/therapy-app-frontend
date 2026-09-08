import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp, ActivityIndicator, Text } from 'react-native';
import { spacing } from '../../constants';
import { BUTTON_COLORS } from 'designs/designs-colors';

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
    const isDisabled = disabled || loading;
    const showDisabledStyles = disabled && !loading;

    const baseTextColor = transparent ? BUTTON_COLORS.secondaryText: BUTTON_COLORS.primaryText;
    const textColor = showDisabledStyles ? BUTTON_COLORS.disabledText : baseTextColor;
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
            accessibilityValue={ loading ? { text: 'Loading' } : undefined }
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

const styles = StyleSheet.create({
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
        borderColor: BUTTON_COLORS.primaryBackground,
        backgroundColor: BUTTON_COLORS.primaryBackground,
    },
    actionButtonTransparent: {
        backgroundColor: BUTTON_COLORS.secondaryBackground,
        borderColor: BUTTON_COLORS.secondaryText,
    },
    actionButtonDisabled: {
        backgroundColor: BUTTON_COLORS.disabledSurface,
        borderColor: BUTTON_COLORS.disabledDark,
    },
    iconWrapper: {
        marginRight: spacing.sm,
    },
});
