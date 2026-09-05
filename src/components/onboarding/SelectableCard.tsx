import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';
import { onboardingStyles } from './onboardingStyles';

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
            style={ [onboardingStyles.card, styles.card, selected && styles.cardSelected] }
        >
            <View style={ [styles.radio, selected && styles.radioSelected] }>
                { selected && <View style={ styles.radioDot } /> }
            </View>

            <AppText variant="h3" style={ [onboardingStyles.title, styles.label] }>
                { label }
            </AppText>

            { selected && (
                <Feather name="check" size={ 20 } color={ TEXT_COLORS.primary } style={ styles.check } />
            ) }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 72,
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderWidth: 2,
    },
    cardSelected: {
        backgroundColor: COLOR_VARIANTS.white.primary,
        borderColor: ACTION_ORANGE,
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
        borderColor: ACTION_ORANGE,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: ACTION_ORANGE,
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
