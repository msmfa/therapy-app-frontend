import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { spacing, typography } from '../../const';
import { Palette } from '../../../design';

interface Props {
	label: string;
	icon?: React.ReactNode;
	onPress: () => void;
	disabled?: boolean;
	transparent?: boolean;
}

export function Button({ label, icon, onPress, disabled = false, transparent = false }: Props) {
    return (
        <TouchableOpacity
            style={ [
                styles.actionButton,
                transparent && styles.actionButtonTransparent,
                disabled && styles.actionButtonDisabled,
            ] }
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ disabled ? 1 : 0.8 }
            accessibilityRole="button"
            accessibilityState={ { disabled } }
        >
            { icon ? (
                <View style={ [styles.iconWrapper, disabled && styles.iconDisabled] }>{ icon }</View>
            ) : null }
            <Text
                style={ [
                    styles.actionButtonText,
                    transparent && styles.actionButtonTextTransparent,
                    disabled && styles.actionButtonTextDisabled,
                ] }
                numberOfLines={ 1 }
            >
                { label }
            </Text>
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
        backgroundColor: 'black',
        width: '100%',
    },
    actionButtonTransparent: {
        backgroundColor: 'transparent',
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(245, 195, 195, 0.03)', // subtle fill
        borderColor: 'rgba(110, 110, 110, 0.1)', // muted border
    },
    iconWrapper: {
        marginRight: spacing.sm,
    },
    iconDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        ...typography.button,
        color: Palette.white,
    },
    actionButtonTextTransparent: {
        color: Palette.black,
    },
    actionButtonTextDisabled: {
        color: 'rgba(92, 92, 92, 0.45)', // muted label
    },
});
