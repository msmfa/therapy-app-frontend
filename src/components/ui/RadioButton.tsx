import { COLOR_VARIANTS, palette } from 'new-design';
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
        borderColor: COLOR_VARIANTS.blue.light,
    },
    notSelectedWrapper: {
        backgroundColor: palette.neutral.transparentTransparent,
        borderColor: COLOR_VARIANTS.blue.light,
    },
    selectedDot: {
        backgroundColor: COLOR_VARIANTS.blue.dark,
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    selectedWrapper: {
        backgroundColor: COLOR_VARIANTS.blue.lightest,
        borderColor: COLOR_VARIANTS.blue.mid,
        borderWidth: 1,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: COLOR_VARIANTS.blue.dark,
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
