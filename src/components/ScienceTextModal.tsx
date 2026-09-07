import { StyleSheet, View } from 'react-native';
import { ReminderType } from '../utils/types';
import { REMINDER_SCIENCE_COPY } from '../constants/neuroReminders';
import AppText from './ui/AppText';
import Spacer, { SpacerVariant } from './ui/Spacer';
import { CitedText } from './ui/CitedText';
import { ExternalLink } from './ui/ExternalLink';
import { GradientCard } from './ui/GradientCard';
import { ACCENT_SURFACE, BRAND_ORANGE, TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    type: ReminderType;
};

/**
 * The science write-up behind one reminder interval. It has no scroll view or
 * safe area of its own: AppModal supplies both, so the page scrolls as one
 * column rather than as a scroll view nested inside another.
 */
export function ScienceTextModal({ type }: Props) {
    const { body, sources, tldr } = REMINDER_SCIENCE_COPY[type];

    return (
        <>
            <GradientCard addedStyles={ styles.gradientContainer }>
                { /* The whole thing in one sentence, first, in a panel of its
                     own: most people open this to decide whether the reminder
                     is worth having, not to read the papers, and that reader
                     should not have to get past a caveat to reach the answer. */ }
                <View style={ styles.tldrPanel }>
                    <AppText variant="body" style={ styles.tldr }>
                        <AppText variant="body" style={ styles.tldrLabel }>TLDR: </AppText>
                        { tldr }
                    </AppText>
                </View>

                <AppText variant="body" style={ styles.caveat }>
                    This research explains the memory methods that inform the schedule.
                </AppText>
                <Spacer variant={ SpacerVariant.small } />

                { body.map((paragraph, index) => (
                    <View key={ `paragraph-${index}` }>
                        <CitedText variant="body" text={ paragraph } sources={ sources } />
                        { index < body.length - 1 && <Spacer variant={ SpacerVariant.small } /> }
                    </View>
                )) }
                <Spacer variant={ SpacerVariant.large } />
            </GradientCard>

            { sources.length > 0 && (
                <View style={ styles.sourcesSection }>
                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant="h3">Sources</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.map((source, index) => (
                        <View key={ source.url } style={ styles.source }>
                            <AppText variant="caption" style={ styles.sourceMarker }>
                                { index + 1 }.
                            </AppText>
                            <ExternalLink
                                variant="caption"
                                text={ source.text }
                                url={ source.url }
                                containerStyle={ styles.sourceLink }
                            />
                        </View>
                    )) }
                </View>
            ) }
        </>
    );
}

/** GradientCard's own horizontal inset, which the full-width panel reaches back through. */
const CARD_PADDING = 20;

/** And its corner radius, which the panel's top corners have to match. */
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
    // Near-white, so the write-up reads as a page rather than as a grey panel
    // with type on it.
    gradientContainer: {
        backgroundColor: 'hsla(0, 0%, 100%, 0.88)',
    },
    caveat: {
        fontWeight: '600',
        color: TEXT_COLORS.primary,
    },
    /**
     * Held clear of the caveat above it and the research below, and run out
     * through the card's own inset so the panel spans the page it sits on
     * rather than the column of type inside it.
     */
    /**
     * Flush with the top of the card, corner to corner: the summary is the
     * first thing on the page rather than a block floating on it.
     *
     * Its top corners take the card's own radius so the two meet cleanly, and
     * its bottom edge stays square, being a rule between the summary and the
     * write-up rather than the end of a panel.
     */
    tldrPanel: {
        marginBottom: 20,
        marginHorizontal: -CARD_PADDING,
        paddingVertical: 16,
        paddingHorizontal: CARD_PADDING,
        borderTopLeftRadius: CARD_RADIUS,
        borderTopRightRadius: CARD_RADIUS,
        backgroundColor: BRAND_ORANGE,
    },
    // The summary is a sentence to read, so it is set as one. Only its label is
    // bold, which is what makes the label a label.
    tldr: {
        color: ACCENT_SURFACE.textPrimary,
    },
    tldrLabel: {
        fontWeight: '700',
        color: ACCENT_SURFACE.textPrimary,
    },
    sourcesSection: {
        alignSelf: 'stretch',
        paddingHorizontal: 12,
    },
    // The numbered list the inline markers count into, laid out like the one
    // on the references page: the number in its own gutter, the link beside it.
    source: {
        flexDirection: 'row',
        gap: 8,
    },
    sourceMarker: {
        width: 20,
        paddingTop: 6,
    },
    sourceLink: {
        flex: 1,
    },
});
