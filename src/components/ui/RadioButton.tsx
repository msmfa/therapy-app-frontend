import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

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
    const styles = useThemedStyles(makeStyles);

    return (
        <TouchableOpacity
            style={ [
                styles.sharedWrapper,
                selectedValue ? styles.selectedWrapper : styles.notSelectedWrapper,
            ] }
            onPress={ onPress }
            accessibilityRole="radio"
            accessibilityState={ { selected: selectedValue, checked: selectedValue } }
        >
            <View style={ [styles.sharedDot, !selectedValue && styles.circleNotSelected] }>
                <View style={ selectedValue && styles.selectedDot } />
            </View>
            <View style={ styles.children }>{ children }</View>
        </TouchableOpacity>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    circleNotSelected: {
        borderColor: theme.radio.ringUnselected,
    },
    // Unselected is the same box, just sitting flatter on the sheet.
    notSelectedWrapper: {
        backgroundColor: theme.radio.unselectedFill,
        borderColor: theme.radio.unselectedBorder,
        shadowOpacity: 0.05,
    },
    selectedDot: {
        backgroundColor: theme.radio.ring,
        borderRadius: 6.5,
        height: 13,
        width: 13,
    },
    // Selected is the same box lifted off the sheet: solid, with a stronger
    // shadow, so the choice reads without a second colour.
    selectedWrapper: {
        backgroundColor: theme.radio.selectedFill,
        borderColor: theme.radio.selectedBorder,
        shadowOpacity: 0.16,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: theme.radio.ring,
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
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 14,
    },
    children: {
        flex: 1,
        marginLeft: 10,
    },
});
