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

const red = 'rgba(226, 61, 61, 1)';
const lightBlue = '#c1d0e0ff';

const styles = StyleSheet.create({
    circleNotSelected: {
        borderColor: lightBlue,
    },
    notSelectedWrapper: {
        backgroundColor: 'transparent',
        borderColor: lightBlue,
    },
    selectedDot: {
        backgroundColor: red,
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    selectedWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.29)',
        borderColor: 'rgba(255, 255, 255, 0.21)',
        borderWidth: 1,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: red,
        borderRadius: 10,
        borderWidth: 2,
        height: 20,
        justifyContent: 'center',
        width: 20,
    },
    sharedWrapper: {
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        padding: 14,
    },
    children: {
        flex: 1,
        marginLeft: 10,
    },
});
