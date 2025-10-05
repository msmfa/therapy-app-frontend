import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp, ActivityIndicator, Text } from 'react-native';
import { spacing, typography } from '../../const';
import { palette } from '../../../new-design';

interface Props {
	label: string;
	icon?: React.ReactNode;
	onPress: () => void;
	disabled?: boolean;
	transparent?: boolean;
    addedStyles?: StyleProp<ViewStyle>;
    loading?: boolean;
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

    const textColor = transparent ? palette.neutral.black : palette.neutral.white;
    const spinnerColor = textColor;

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
                <View style={ styles.iconWrapper }>{ icon }</View>
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
        borderColor: palette.neutral.black,
        minHeight: 44,
        backgroundColor: palette.neutral.black,
        width: '100%',
    },
    actionButtonTransparent: {
        backgroundColor: palette.neutral.transparentTransparent,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    iconWrapper: {
        marginRight: spacing.sm,
    },
    actionButtonText: {
        ...typography.button,
    },
});
