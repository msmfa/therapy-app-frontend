import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { CARD_RADIUS, useOnboardingStyles } from './onboardingStyles';
import { CardLight } from './CardLight';
import { subscriptionCopy } from '../../features/onboarding/onboardingCopy';

const CARD_BORDER_WIDTH = 2;

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
    disabled?: boolean;
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
    disabled = false,
    onPress,
    accessibilityLabel,
}: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { onboardingStyles } = useOnboardingStyles();
    // The chosen plan is lit in its own orange, where the theme has one.
    const light = selected ? theme.plan.light : theme.surface.cardLight;

    return (
        <TouchableOpacity
            onPress={ onPress }
            disabled={ disabled }
            activeOpacity={ 0.85 }
            accessibilityRole="radio"
            accessibilityLabel={ accessibilityLabel }
            accessibilityState={ { selected, checked: selected, disabled } }
            style={ [
                onboardingStyles.card,
                styles.card,
                selected && styles.cardSelected,
                // The light paints the edge itself, so the border it covers
                // must not show through as a second, flat outline.
                light !== null && styles.cardLit,
                disabled && styles.disabled,
            ] }
        >
            { /* The night's cards are lit from the top-left corner, behind
                 the content, where the day's card is one flat tint. */ }
            { light !== null && <CardLight light={ light } radius={ CARD_RADIUS } borderWidth={ CARD_BORDER_WIDTH } /> }
            <View style={ styles.headerRow }>
                { /* The tick lives in the radio rather than off at the end of
                     the row: one mark saying chosen, on the control that does
                     the choosing. */ }
                <View style={ [styles.radio, selected && styles.radioSelected] }>
                    { selected && <LinearGradient colors={ theme.plan.mark } style={ [StyleSheet.absoluteFill, styles.markFill] } /> }
                    { selected && <Feather name="check" size={ 13 } color={ theme.plan.check } /> }
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
                                    color={ selected ? theme.plan.inkBrightest : theme.ink.primary }
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
                { `${renewalLine} ${subscriptionCopy().cancelAnytime}.` }
            </AppText>
        </TouchableOpacity>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    disabled: {
        opacity: 0.5,
    },
    description: {
        marginTop: 8,
        color: theme.ink.secondary,
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
        backgroundColor: theme.plan.iconDisc,
    },
    timelineText: {
        flex: 1,
        fontSize: 15,
    },
    card: {
        borderWidth: CARD_BORDER_WIDTH,
        paddingHorizontal: 20,
        paddingVertical: 20,
        minHeight: 44,
    },
    cardLit: {
        borderColor: 'transparent',
    },
    // The same chosen state as the questions' own options: one way of showing a
    // selection across the flow, whether the choice is a goal or a plan.
    cardSelected: {
        backgroundColor: theme.plan.fill,
        borderColor: theme.plan.border,
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
        borderColor: theme.radio.ringUnselected,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    // The questions' own radio, filled rather than ringed.
    radioSelected: {
        borderColor: 'transparent',
    },
    // Rounded on the gradient itself: the native gradient view does not clip
    // to its parent's corners, so without this the disc drew as a square.
    markFill: {
        borderRadius: 11,
    },
    title: {
        fontSize: 18,
    },
    titleSelected: {
        color: theme.plan.inkBright,
    },
    /**
     * Every line inside a chosen card, which is a solid orange section: the
     * greys the card uses on white are close to unreadable on it, and the
     * hierarchy between them was never carrying much anyway.
     */
    onAccent: {
        color: theme.plan.inkBright,
    },
    onAccentSoftest: {
        color: theme.plan.inkBrightest,
    },
    /** The plain badge, as an outline rather than a grey pill on the orange. */
    badgeSelected: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.plan.inkBrightest,
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
        backgroundColor: theme.surface.chip,
    },
    badgeText: {
        fontSize: 14,
        color: theme.ink.secondary,
    },
    // Free time is the good news on the card, so it is the app's green rather
    // than another grey pill: a pale fill inside a border, with an ink darker
    // than both so it reads at 14pt.
    trialBadge: {
        backgroundColor: theme.trialBadge.background,
        borderWidth: 1,
        borderColor: theme.trialBadge.border,
    },
    trialBadgeText: {
        fontSize: 14,
        color: theme.trialBadge.text,
    },
    // On a chosen card the green pill sat on orange and turned muddy. Black
    // holds against the fill, and the type inside it steps down to grey.
    trialBadgeSelected: {
        backgroundColor: theme.plan.trialFill,
        borderWidth: 0,
        // Roomier than the plain badges beside it: the trial is the one thing
        // on the card worth stopping on.
        paddingHorizontal: 16,
    },
    trialBadgeSelectedText: {
        fontSize: 14,
        color: theme.plan.trialText,
    },
    price: {
        marginTop: 12,
        fontSize: 18,
    },
    secondary: {
        marginTop: 2,
        color: theme.ink.secondary,
    },
    renewal: {
        marginTop: 8,
        color: theme.ink.tertiary,
    },
});
