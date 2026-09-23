import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

export type RadioOption = {
    value: string;
    label: string;
};

export type RadioButtonProps = {
    selectedValue: boolean;
    children: React.ReactNode;
    onPress: () => void;
};

const HEIGHT = 60;
const WELL = 40;

/**
 * A frosted pill: see-through enough that the sheet's colour comes up
 * through it, with a sheen down from a lit top edge. The dot sits in a round
 * well at the leading end, where a list row would carry its icon.
 *
 * Choosing an option frosts its pill over rather than recolouring it, so the
 * choice reads without a second colour.
 */
export default function RadioButton({ selectedValue, onPress, children }: RadioButtonProps) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <TouchableOpacity
            activeOpacity={ 0.85 }
            style={ [
                styles.sharedWrapper,
                selectedValue ? styles.selectedWrapper : styles.notSelectedWrapper,
            ] }
            onPress={ onPress }
            accessibilityRole="radio"
            accessibilityState={ { selected: selectedValue, checked: selectedValue } }
        >
            <LinearGradient
                colors={ theme.radio.sheen }
                pointerEvents="none"
                style={ [styles.sheen, !selectedValue && styles.sheenNotSelected] }
            />
            <View style={ styles.well }>
                <View style={ [styles.sharedDot, !selectedValue && styles.circleNotSelected] }>
                    <View style={ selectedValue && styles.selectedDot } />
                </View>
            </View>
            <View style={ styles.children }>{ children }</View>
        </TouchableOpacity>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    circleNotSelected: {
        borderColor: theme.radio.ringUnselected,
    },
    notSelectedWrapper: {
        backgroundColor: theme.radio.unselectedFill,
        borderColor: theme.radio.unselectedBorder,
        shadowOpacity: 0.04,
    },
    selectedDot: {
        backgroundColor: theme.radio.ring,
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    selectedWrapper: {
        backgroundColor: theme.radio.selectedFill,
        borderColor: theme.radio.selectedBorder,
        shadowOpacity: 0.1,
    },
    sharedDot: {
        alignItems: 'center',
        borderColor: theme.radio.ring,
        borderRadius: 9,
        borderWidth: 1.5,
        height: 18,
        justifyContent: 'center',
        width: 18,
    },
    sharedWrapper: {
        alignItems: 'center',
        borderRadius: HEIGHT / 2,
        borderWidth: 1,
        elevation: 4,
        flexDirection: 'row',
        height: HEIGHT,
        paddingLeft: (HEIGHT - WELL) / 2 - 1,
        paddingRight: 20,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
    },
    // Rounded to the pill rather than clipped by it: clipping the pill would
    // clip its shadow too.
    sheen: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: HEIGHT / 2,
    },
    // Half the light on an unchosen pill, so its blue is not washed out.
    sheenNotSelected: {
        opacity: 0.5,
    },
    well: {
        alignItems: 'center',
        backgroundColor: theme.radio.well,
        borderRadius: WELL / 2,
        height: WELL,
        justifyContent: 'center',
        width: WELL,
    },
    children: {
        flex: 1,
        marginLeft: 12,
    },
});
