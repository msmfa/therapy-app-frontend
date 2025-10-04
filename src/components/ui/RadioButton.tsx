import { colors } from 'new-design';
import React, { useMemo } from 'react';
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
const BASE_HUE = 220;
const BACKGROUND_SATURATION = 60;
const BACKGROUND_LIGHTNESS = 93;

export default function RadioButton({ selectedValue, onPress, children }: RadioButtonProps) {
    const backgroundColor = useMemo(
        () => `hsl(${BASE_HUE}, ${BACKGROUND_SATURATION}%, ${BACKGROUND_LIGHTNESS}%)`,
        []
    );


    return (
        <TouchableOpacity
            style={ [
                styles.sharedWrapper,
                selectedValue ? [styles.selectedWrapper, { backgroundColor }] : styles.notSelectedWrapper,
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

const lightBlue = '#C1D0E0FF';

const styles = StyleSheet.create({
    circleNotSelected: {
        borderColor: lightBlue,
    },
    notSelectedWrapper: {
        backgroundColor: '#00000000',
        borderColor: lightBlue,
    },
    selectedDot: {
        backgroundColor: colors.primary,
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    selectedWrapper: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryHover,
        borderWidth: 1,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: colors.primary,
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
