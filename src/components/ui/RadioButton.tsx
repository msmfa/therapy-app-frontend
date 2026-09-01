import { ACTION_BLUE_DARK, PALETTE } from 'designs/designs-colors';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export type RadioOption = {
    value: string;
    label: string;
};

export type RadioButtonProps = {
    selectedValue: boolean;
    children: React.ReactNode;
    onPress: () => void;
};

export default function RadioButton({ selectedValue, onPress, children }: RadioButtonProps) {
    return (
        <TouchableOpacity
            style={ [
                styles.sharedWrapper,
                selectedValue ? styles.selectedWrapper : styles.notSelectedWrapper,
            ] }
            onPress={ onPress }
        >
            <View style={ [styles.sharedDot, !selectedValue && styles.circleNotSelected] }>
                <View style={ selectedValue && styles.selectedDot } />
            </View>
            <View style={ styles.children }>{ children }</View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    circleNotSelected: {
        borderColor: 'hsla(222, 30%, 40%, 0.35)',
    },
    // Unselected is the same white box, just sitting flatter on the sheet.
    notSelectedWrapper: {
        backgroundColor: 'hsla(0, 0%, 100%, 0.55)',
        borderColor: 'hsla(0, 0%, 100%, 0.70)',
        shadowOpacity: 0.05,
    },
    selectedDot: {
        backgroundColor: ACTION_BLUE_DARK,
        borderRadius: 6.5,
        height: 13,
        width: 13,
    },
    // Selected is the same box lifted off the sheet: solid white with a
    // stronger shadow, so the choice reads without a second colour.
    selectedWrapper: {
        backgroundColor: 'hsl(0, 0%, 100%)',
        borderColor: 'hsl(0, 0%, 100%)',
        shadowOpacity: 0.16,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: ACTION_BLUE_DARK,
        borderRadius: 10,
        borderWidth: 2,
        height: 20,
        justifyContent: 'center',
        width: 20,
    },
    sharedWrapper: {
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        elevation: 6,
        flexDirection: 'row',
        // Fixed rather than minimum: the badge on one option makes its content
        // taller than the other's, and the two boxes have to match.
        height: 72,
        paddingHorizontal: 16,
        paddingVertical: 0,
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 14,
    },
    children: {
        flex: 1,
        marginLeft: 10,
    },
});
