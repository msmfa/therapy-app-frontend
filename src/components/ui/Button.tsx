import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp, ActivityIndicator, Text } from 'react-native';
import { spacing, typography } from '../../const';
import { colors } from '../../../new-design';

interface Props {
	label: string;
	icon?: React.ReactNode;
	onPress: () => void;
	disabled?: boolean;
	transparent?: boolean;
    addedStyles?: StyleProp<ViewStyle>;
    loading?: boolean;
}

const DISABLED_TEXT_COLOR = colors.textMuted;

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

    const textColor = transparent
        ? (isDisabled ? DISABLED_TEXT_COLOR : colors.text)
        : (isDisabled ? DISABLED_TEXT_COLOR : colors.bgLight);

    const spinnerColor = transparent
        ? (isDisabled ? DISABLED_TEXT_COLOR : colors.text)
        : colors.bgLight;

    return (
        <TouchableOpacity
            style={ [
                styles.actionButton,
                transparent && styles.actionButtonTransparent,
                isDisabled && styles.actionButtonDisabled,
                addedStyles && addedStyles,
            ] }
            onPress={ onPress }
            disabled={ isDisabled }
            activeOpacity={ isDisabled ? 1 : 0.8 }
            accessibilityRole="button"
            accessibilityState={ { disabled: isDisabled } }
        >
            { loading ? (
                <ActivityIndicator color={ spinnerColor } />
            ) : icon ? (
                <View style={ [styles.iconWrapper, isDisabled && styles.iconDisabled] }>{ icon }</View>
            ) : null }
            { !loading ? (
                <Text
                    style={ [styles.actionButtonText, { color: textColor }] }
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
        borderColor: colors.primary,
        minHeight: 44,
        backgroundColor: colors.primary,
        width: '100%',
    },
    actionButtonTransparent: {
        backgroundColor: 'transparent',
    },
    actionButtonDisabled: {
        backgroundColor: colors.borderLight,
        borderColor: colors.border,
    },
    iconWrapper: {
        marginRight: spacing.sm,
    },
    iconDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        ...typography.button,
    },
});
