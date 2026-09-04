import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_BLUE_DARK, COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';

type Props = {
    label: string;
    selected: boolean;
    onPress: () => void;
};

/**
 * A full-width single-select card.
 *
 * Selection is carried by three things at once: a filled radio, a checkmark and
 * a heavier border. Colour alone would leave the state invisible to anyone who
 * cannot separate the two blues.
 */
export function SelectableCard({ label, selected, onPress }: Props) {
    return (
        <TouchableOpacity
            onPress={ onPress }
            activeOpacity={ 0.8 }
            accessibilityRole="radio"
            accessibilityLabel={ label }
            accessibilityState={ { selected, checked: selected } }
            style={ [styles.card, selected ? styles.cardSelected : styles.cardIdle] }
        >
            <View style={ [styles.radio, selected && styles.radioSelected] }>
                { selected && <View style={ styles.radioDot } /> }
            </View>

            <AppText variant="h3" style={ styles.label }>
                { label }
            </AppText>

            { selected && (
                <Feather name="check" size={ 20 } color={ ACTION_BLUE_DARK } style={ styles.check } />
            ) }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 60,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardIdle: {
        backgroundColor: 'hsla(0, 0%, 100%, 0.55)',
        borderColor: PALETTE.overlay.whiteBorderTransparent,
    },
    cardSelected: {
        backgroundColor: COLOR_VARIANTS.white.primary,
        borderColor: ACTION_BLUE_DARK,
        borderWidth: 2,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'hsla(222, 30%, 40%, 0.40)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: ACTION_BLUE_DARK,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: ACTION_BLUE_DARK,
    },
    label: {
        flex: 1,
        fontSize: 17,
        lineHeight: 24,
    },
    check: {
        marginLeft: 4,
    },
});
