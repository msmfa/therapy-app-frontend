import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { spacing, typography } from '../../const';
import { Palette } from '../../../design';

interface Props {
	label: string;
	icon?: React.ReactNode;
	onPress: () => void;
	disabled?: boolean;
}

export function Button({ label, icon, onPress, disabled = false }: Props) {
    return (
        <TouchableOpacity
            style={ [styles.actionButton, disabled && styles.actionButtonDisabled] }
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
                style={ [styles.actionButtonText, disabled && styles.actionButtonTextDisabled] }
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
    actionButtonDisabled: {
        backgroundColor: 'rgba(0,0,0,0.03)', // subtle fill
        borderColor: 'rgba(0,0,0,0.10)', // muted border
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
    actionButtonTextDisabled: {
        color: 'rgba(0,0,0,0.45)', // muted label
    },
});
