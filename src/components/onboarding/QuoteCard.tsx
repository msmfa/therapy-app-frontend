import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../ui/AppText';
import { QuoteMark } from './QuoteMark';
import { CARD_RADIUS, useOnboardingStyles } from './onboardingStyles';
import { CardLight } from './CardLight';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

type Props = {
    quote: string;
    name: string;
    role: string;
};

/**
 * One tester's words. No stars, no counts, no carousel.
 *
 * Deliberately the odd card out. Every other surface in onboarding is the same
 * translucent white, which is right for the app talking about itself and wrong
 * for somebody else talking about it: the flow's own cards and a stranger's
 * sentence read as one voice. This one is the brand orange with white on it,
 * the same block the notes screen is, and opens on the website's quote mark, so
 * a reader can see at a glance that the words are not ours.
 */
export function QuoteCard({ quote, name, role }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { onboardingStyles } = useOnboardingStyles();

    const light = theme.testimonial.light;

    return (
        <View testID="quote-card" style={ [onboardingStyles.card, styles.card, light !== null && styles.cardLit] }>
            { /* At night the orange is lit from its corner like the chosen
                 plan; by day the flat orange fill carries it alone. */ }
            { light !== null && <CardLight light={ light } radius={ CARD_RADIUS } /> }
            { /* The mark sits inside the sentence rather than beside it, so
                 the quote wraps back under it instead of running in a narrow
                 column to its right. Decorative: the sentence is already read
                 as a quotation, and announcing the mark would only add
                 punctuation noise. */ }
            <AppText testID="quote-row" variant="body" style={ [onboardingStyles.body, styles.quote] }>
                <View
                    style={ styles.mark }
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    <QuoteMark width={ MARK_WIDTH } color={ theme.testimonial.ink } />
                </View>
                { `  ${quote}` }
            </AppText>

            { /* Both together at the right-hand end of the card, the name
                 first: the person is who the quotation belongs to, and what
                 they are is the qualifier after it. */ }
            <View
                style={ styles.attribution }
                accessible
                accessibilityLabel={ `${name}, ${role}` }
            >
                <AppText variant="h3" style={ [onboardingStyles.title, styles.name] }>
                    { name }
                </AppText>
                { /* Its own element rather than a character on the front of the
                     role, so the row's gap falls on both sides of it and the
                     slash sits centred between the two. */ }
                <AppText variant="caption" style={ styles.role }>
                    { ATTRIBUTION_SEPARATOR }
                </AppText>
                <AppText variant="caption" style={ styles.role }>
                    { role }
                </AppText>
            </View>
        </View>
    );
}

/** Set against the 18pt quote it opens, not the website's own 16pt column. */
const MARK_WIDTH = 22;

/** Between the name and the role; the row's gap does the spacing. */
const ATTRIBUTION_SEPARATOR = '/';

/** The mark's own proportions, from its 30x24 artboard. */
const QUOTE_MARK_ASPECT = 30 / 24;

const makeStyles = (theme: Theme) => StyleSheet.create({
    card: {
        padding: 22,
        backgroundColor: theme.testimonial.panel,
        borderColor: theme.testimonial.panel,
    },
    // The light paints the edge itself, so the border it covers must not
    // show through as a second, flat outline.
    cardLit: {
        borderColor: 'transparent',
    },
    /**
     * An inline box inside the text, which needs its own size: nested in a
     * Text, it is laid out as a character rather than as a flexed child.
     * Dropped a little so the mark's drawing, which sits high in its box, lands
     * on the capitals it opens rather than above them.
     */
    mark: {
        width: MARK_WIDTH,
        height: MARK_WIDTH / QUOTE_MARK_ASPECT,
        transform: [{ translateY: 3 }],
    },
    // Body face, not the serif accent: this is a paragraph, and the brand serif
    // is reserved for short accents. The typed curly quotes are gone with the
    // mark beside it carrying that job; two sets of quotes marked it twice.
    quote: {
        flex: 1,
        fontSize: 18,
        lineHeight: 27,
        color: theme.testimonial.ink,
    },
    attribution: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        gap: 8,
    },
    // One colour across the whole line, and softer than the quotation itself.
    // The words are what the card is for; whose they are is the footnote, and
    // at the same white the two competed. The name keeps its weight, which is
    // what separates it from the role beside it.
    name: {
        fontSize: 15,
        color: theme.testimonial.inkMuted,
    },
    role: {
        flexShrink: 1,
        color: theme.testimonial.inkMuted,
    },
});
