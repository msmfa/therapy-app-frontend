import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Palette } from '../../../design';

interface Props {
    onPress: () => void;
    disabled?: boolean;
}

export function ButtonCircle({ onPress, disabled = false }: Props) {
    return (
        <TouchableOpacity
            style={ [styles.actionButton, disabled && styles.actionButtonDisabled] }
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ disabled ? 1 : 0.8 }
            accessibilityRole="button"
            accessibilityState={ { disabled } }
        >
            <Text style={ [styles.label, disabled && styles.labelDisabled] }>+</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Palette.black,
        shadowColor: 'rgba(44, 44, 45, 0.9)',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 1,
        shadowRadius: 24,
        borderWidth: 1,
        // borderColor: 'white',
        elevation: 8,

        // marginBottom: 16,
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(253, 251, 251, 0.45)',
    },
    label: {
        fontSize: 28,
        lineHeight: 30,
        color: 'white',
    },
    labelDisabled: {
        color: 'rgba(255, 255, 255, 0.75)',
    },
});
