import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, PixelRatio, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';
import { onboardingStyles } from './onboardingStyles';

type Props = {
    label: string;
    selected: boolean;
    onPress: () => void;
    /**
     * A floor, in points, for this card's height. Comes from
     * `useEqualSelectableCardHeights` so every option in a group matches the
     * tallest of them. It is never a cap, so nothing is cut off.
     */
    height?: number;
    /** Reports the card's natural height to the group. */
    onLayout?: (event: LayoutChangeEvent) => void;
};

const CHECK_SIZE = 20;

/**
 * One height for every option in a group: the tallest one's.
 *
 * A number cannot be hard-coded here. What a label wraps to depends on the
 * copy, the text size the reader has chosen and the language it is translated
 * into, and a card cut to a guess would clip in any of those. So the cards
 * report what they need and the tallest answer becomes the floor for all of
 * them, which settles in a single extra layout pass.
 */
export function useEqualSelectableCardHeights(): {
    height: number | undefined;
    onCardLayout: (event: LayoutChangeEvent) => void;
} {
    const { fontScale, width } = useWindowDimensions();
    const [height, setHeight] = useState<number | undefined>(undefined);

    // A smaller text size must be allowed to give the space back, and the
    // running maximum can only grow, so it is dropped and measured again.
    useEffect(() => {
        setHeight(undefined);
    }, [fontScale, width]);

    const onCardLayout = useCallback((event: LayoutChangeEvent) => {
        // Native layout can report 84.000007 for an 84pt card. Rounding that
        // up feeds an extra point back into minHeight on every layout pass.
        const measured = PixelRatio.roundToNearestPixel(event.nativeEvent.layout.height);
        setHeight((tallest) => (tallest === undefined || measured > tallest ? measured : tallest));
    }, []);

    return { height, onCardLayout };
}

/**
 * A full-width single-select card.
 *
 * Selection is carried by three things at once: a filled radio, a checkmark and
 * a heavier border. Colour alone would leave the state invisible to anyone who
 * cannot separate the two blues.
 */
export function SelectableCard({ label, selected, onPress, height, onLayout }: Props) {
    return (
        <TouchableOpacity
            onPress={ onPress }
            onLayout={ onLayout }
            activeOpacity={ 0.8 }
            accessibilityRole="radio"
            accessibilityLabel={ label }
            accessibilityState={ { selected, checked: selected } }
            style={ [
                onboardingStyles.card,
                styles.card,
                selected && styles.cardSelected,
                height !== undefined && { minHeight: height },
            ] }
        >
            <View style={ [styles.radio, selected && styles.radioSelected] }>
                { selected && <View style={ styles.radioDot } /> }
            </View>

            <AppText variant="h3" style={ [onboardingStyles.title, styles.label] }>
                { label }
            </AppText>

            { /* The slot is always there, whether or not it holds a check.
                 Adding it on selection took its width off the label, which
                 could rewrap and grow the card under the finger that chose it. */ }
            <View testID="selectable-card-check" style={ styles.check }>
                { selected && (
                    <Feather name="check" size={ CHECK_SIZE } color={ TEXT_COLORS.primary } />
                ) }
            </View>
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
        flexShrink: 0,
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
        width: CHECK_SIZE,
        height: CHECK_SIZE,
        flexShrink: 0,
        marginLeft: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
