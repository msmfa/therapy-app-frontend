import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';
import { onboardingStyles } from './onboardingStyles';

type Props = {
    title: string;
    badge: string;
    /** One line under the title saying what the plan is. */
    description?: string;
    /** The trial's three moments, shown only on the featured, trial-bearing card. */
    timeline?: { icon: 'unlock' | 'bell' | 'star'; text: string }[];
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
    description,
    timeline,
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
            style={ [onboardingStyles.card, styles.card, selected && styles.cardSelected] }
        >
            <View style={ styles.headerRow }>
                <View style={ [styles.radio, selected && styles.radioSelected] }>
                    { selected && <View style={ styles.radioDot } /> }
                </View>

                <AppText variant="h2" style={ [onboardingStyles.title, styles.title] }>
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
                    <Feather name="check" size={ 18 } color={ TEXT_COLORS.primary } />
                ) }
            </View>

            { description !== undefined && (
                <AppText variant="body" style={ styles.description }>
                    { description }
                </AppText>
            ) }

            <AppText variant="h3" style={ styles.price }>
                { priceLine }
            </AppText>

            { timeline !== undefined && (
                <View style={ styles.timeline }>
                    { timeline.map((step) => (
                        <View key={ step.text } style={ styles.timelineRow }>
                            <View style={ styles.timelineIcon }>
                                <Feather name={ step.icon } size={ 14 } color={ TEXT_COLORS.primary } />
                            </View>
                            <AppText variant="body" style={ styles.timelineText }>
                                { step.text }
                            </AppText>
                        </View>
                    )) }
                </View>
            ) }

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
    description: {
        marginTop: 8,
        color: TEXT_COLORS.secondary,
    },
    timeline: {
        marginTop: 12,
        gap: 10,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    timelineIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsla(21, 75%, 54%, 0.12)',
    },
    timelineText: {
        flex: 1,
        fontSize: 15,
    },
    card: {
        borderWidth: 2,
        paddingHorizontal: 20,
        paddingVertical: 20,
        minHeight: 44,
    },
    cardSelected: {
        backgroundColor: COLOR_VARIANTS.white.primary,
        borderColor: ACTION_ORANGE,
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
        borderColor: ACTION_ORANGE,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: ACTION_ORANGE,
    },
    title: {
        fontSize: 18,
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: 'hsla(0, 0%, 0%, 0.06)',
    },
    badgeText: {
        fontSize: 14,
        color: TEXT_COLORS.secondary,
    },
    trialBadge: {
        backgroundColor: 'hsla(21, 75%, 54%, 0.12)',
    },
    trialBadgeText: {
        fontSize: 14,
        color: TEXT_COLORS.primary,
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
