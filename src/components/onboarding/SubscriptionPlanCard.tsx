import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_BLUE_DARK, COLOR_VARIANTS, PALETTE, TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    title: string;
    badge: string;
    /** Shown only where the user is eligible for the introductory offer. */
    trialBadge?: string;
    priceLine: string;
    secondaryLine?: string;
    renewalLine: string;
    selected: boolean;
    onPress: () => void;
    accessibilityLabel: string;
};

/**
 * One of the two plans.
 *
 * Both cards use the same size, type scale and price prominence. Annual is
 * emphasised by its badges rather than by making monthly harder to read or
 * harder to hit.
 */
export function SubscriptionPlanCard({
    title,
    badge,
    trialBadge,
    priceLine,
    secondaryLine,
    renewalLine,
    selected,
    onPress,
    accessibilityLabel,
}: Props) {
    return (
        <TouchableOpacity
            onPress={ onPress }
            activeOpacity={ 0.85 }
            accessibilityRole="radio"
            accessibilityLabel={ accessibilityLabel }
            accessibilityState={ { selected, checked: selected } }
            style={ [styles.card, selected ? styles.cardSelected : styles.cardIdle] }
        >
            <View style={ styles.headerRow }>
                <View style={ [styles.radio, selected && styles.radioSelected] }>
                    { selected && <View style={ styles.radioDot } /> }
                </View>

                <AppText variant="h2" style={ styles.title }>
                    { title }
                </AppText>

                <View style={ styles.badges }>
                    { trialBadge !== undefined && (
                        <View style={ [styles.badge, styles.trialBadge] }>
                            <AppText variant="caption" style={ styles.trialBadgeText }>
                                { trialBadge }
                            </AppText>
                        </View>
                    ) }
                    <View style={ styles.badge }>
                        <AppText variant="caption" style={ styles.badgeText }>
                            { badge }
                        </AppText>
                    </View>
                </View>

                { selected && (
                    <Feather name="check" size={ 18 } color={ ACTION_BLUE_DARK } />
                ) }
            </View>

            <AppText variant="h3" style={ styles.price }>
                { priceLine }
            </AppText>

            { secondaryLine !== undefined && (
                <AppText variant="caption" style={ styles.secondary }>
                    { secondaryLine }
                </AppText>
            ) }

            <AppText variant="caption" style={ styles.renewal }>
                { renewalLine }
            </AppText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 44,
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
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
    title: {
        fontSize: 18,
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
        flexShrink: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'hsla(0, 0%, 0%, 0.06)',
    },
    badgeText: {
        fontSize: 14,
        color: TEXT_COLORS.secondary,
    },
    trialBadge: {
        backgroundColor: 'hsla(222, 70%, 26%, 0.10)',
    },
    trialBadgeText: {
        fontSize: 14,
        color: ACTION_BLUE_DARK,
    },
    price: {
        marginTop: 12,
        fontSize: 18,
    },
    secondary: {
        marginTop: 2,
        color: TEXT_COLORS.secondary,
    },
    renewal: {
        marginTop: 8,
        color: TEXT_COLORS.tertiary,
    },
});
