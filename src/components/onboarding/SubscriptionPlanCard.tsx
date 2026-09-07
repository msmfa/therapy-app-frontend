import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import {
    ACCENT_INK_BRIGHT,
    ACCENT_INK_BRIGHTEST,
    ACCENT_MARK,
    BRAND_ORANGE,
    COLOR_VARIANTS,
    GREEN_PANEL,
    PALETTE,
    TEXT_COLORS,
} from 'designs/designs-colors';
import { onboardingStyles } from './onboardingStyles';
import { SUBSCRIPTION_COPY } from '../../features/onboarding/onboardingCopy';

type Props = {
    title: string;
    /** Omitted where a plan has nothing to claim over the other. */
    badge?: string;
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
                { /* The tick lives in the radio rather than off at the end of
                     the row: one mark saying chosen, on the control that does
                     the choosing. */ }
                <View style={ [styles.radio, selected && styles.radioSelected] }>
                    { selected && <Feather name="check" size={ 13 } color={ BRAND_ORANGE } /> }
                </View>

                <AppText
                    variant="h2"
                    style={ [onboardingStyles.title, styles.title, selected && styles.titleSelected] }
                >
                    { title }
                </AppText>

                <View style={ styles.badges }>
                    { trialBadge !== undefined && (
                        <View style={ [styles.badge, selected ? styles.trialBadgeSelected : styles.trialBadge] }>
                            <AppText
                                variant="caption"
                                style={ selected ? styles.trialBadgeSelectedText : styles.trialBadgeText }
                            >
                                { trialBadge }
                            </AppText>
                        </View>
                    ) }
                    { badge !== undefined && (
                        <View style={ [styles.badge, selected && styles.badgeSelected] }>
                            <AppText variant="caption" style={ [styles.badgeText, selected && styles.onAccentSoftest] }>
                                { badge }
                            </AppText>
                        </View>
                    ) }
                </View>

                { /* The slot stays, empty: the tick has moved into the radio.
                     Its width comes off the header either way, so dropping it
                     on the chosen card alone would set the two plans in
                     different measures. */ }
                <View style={ styles.check } />
            </View>

            { description !== undefined && (
                <AppText variant="body" style={ [styles.description, selected && styles.onAccent] }>
                    { description }
                </AppText>
            ) }

            <AppText variant="h3" style={ [styles.price, selected && styles.onAccent] }>
                { priceLine }
            </AppText>

            { timeline !== undefined && (
                <View style={ styles.timeline }>
                    { timeline.map((step) => (
                        <View key={ step.text } style={ styles.timelineRow }>
                            <View style={ [styles.timelineIcon, selected && styles.timelineIconSelected] }>
                                <Feather
                                    name={ step.icon }
                                    size={ 14 }
                                    color={ selected ? ACCENT_INK_BRIGHTEST : TEXT_COLORS.primary }
                                />
                            </View>
                            <AppText variant="body" style={ [styles.timelineText, selected && styles.onAccentSoftest] }>
                                { step.text }
                            </AppText>
                        </View>
                    )) }
                </View>
            ) }

            { secondaryLine !== undefined && (
                <AppText variant="caption" style={ [styles.secondary, selected && styles.onAccent] }>
                    { secondaryLine }
                </AppText>
            ) }

            { /* The renewal terms and the way out of them, together. Adrift
                 under the button, "Cancel anytime" was a reassurance about a
                 sentence the reader had already passed. */ }
            <AppText variant="caption" style={ [styles.renewal, selected && styles.onAccentSoftest] }>
                { `${renewalLine} ${SUBSCRIPTION_COPY.cancelAnytime}.` }
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
    },
    // The disc only earns its place on the orange, where it separates the icon
    // from the fill. On the white card it was a tint round three small marks.
    timelineIconSelected: {
        backgroundColor: 'hsla(21, 75%, 54%, 0.20)',
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
    // The same chosen state as the questions' own options: one way of showing a
    // selection across the flow, whether the choice is a goal or a plan.
    cardSelected: {
        backgroundColor: BRAND_ORANGE,
        // A light edge, not a dark one: a deeper orange round a chosen card
        // read as a shadow rather than as the card's own outline.
        borderColor: ACCENT_MARK,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
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
    // The questions' own radio, filled rather than ringed.
    radioSelected: {
        borderColor: 'transparent',
        backgroundColor: ACCENT_MARK,
    },
    // Keep this space when unselected so choosing a plan cannot wrap the
    // header onto another line and change the card's height.
    check: {
        width: 18,
        height: 18,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
    },
    titleSelected: {
        color: ACCENT_INK_BRIGHT,
    },
    /**
     * Every line inside a chosen card, which is a solid orange section: the
     * greys the card uses on white are close to unreadable on it, and the
     * hierarchy between them was never carrying much anyway.
     */
    onAccent: {
        color: ACCENT_INK_BRIGHT,
    },
    onAccentSoftest: {
        color: ACCENT_INK_BRIGHTEST,
    },
    /** The plain badge, as an outline rather than a grey pill on the orange. */
    badgeSelected: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: ACCENT_INK_BRIGHTEST,
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
    // Free time is the good news on the card, so it is the app's green rather
    // than another grey pill: a pale fill inside a border, with an ink darker
    // than both so it reads at 14pt.
    trialBadge: {
        backgroundColor: GREEN_PANEL.background,
        borderWidth: 1,
        borderColor: GREEN_PANEL.border,
    },
    trialBadgeText: {
        fontSize: 14,
        color: GREEN_PANEL.text,
    },
    // On a chosen card the green pill sat on orange and turned muddy. Black
    // holds against the fill, and the type inside it steps down to grey.
    trialBadgeSelected: {
        backgroundColor: PALETTE.neutral.black,
        borderWidth: 0,
        // Roomier than the plain badges beside it: the trial is the one thing
        // on the card worth stopping on.
        paddingHorizontal: 16,
    },
    trialBadgeSelectedText: {
        fontSize: 14,
        color: COLOR_VARIANTS.white.secondary,
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
