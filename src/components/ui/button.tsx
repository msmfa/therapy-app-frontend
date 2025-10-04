import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp, ActivityIndicator, Text } from 'react-native';
import { spacing, typography } from '../../const';
import { Palette } from '../../../design';

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
    const textColor = transparent
        ? Palette.black
        : isDisabled
            ? '#5C5C5C73'
            : Palette.white;

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
                <ActivityIndicator color={ transparent ? Palette.black : Palette.white } />
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
        borderColor: Palette.black,
        minHeight: 44,
        backgroundColor: '#000000',
        width: '100%',
    },
    actionButtonTransparent: {
        backgroundColor: '#00000000',
    },
    actionButtonDisabled: {
        backgroundColor: '#F5C3C308', // subtle fill
        borderColor: '#6E6E6E1A', // muted border
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
