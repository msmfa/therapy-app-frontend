import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ReminderType } from '../utils/types';
import { reminderScienceCopy } from '../constants/neuroReminders';
import { SCIENCE_ILLUSTRATIONS } from '../constants/scienceIllustrations';
import AppText from './ui/AppText';
import Spacer, { SpacerVariant } from './ui/Spacer';
import { CitedText } from './ui/CitedText';
import { ExternalLink } from './ui/ExternalLink';
import { GradientCard } from './ui/GradientCard';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../context/theme';
import { useTranslation } from 'react-i18next';

type Props = {
    type: ReminderType;
};

/**
 * The science write-up behind one reminder interval. It has no scroll view or
 * safe area of its own: AppModal supplies both, so the page scrolls as one
 * column rather than as a scroll view nested inside another.
 */
export function ScienceTextModal({ type }: Props) {
    const { t } = useTranslation('science');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { body, sources, tldr } = reminderScienceCopy()[type];
    const illustrations = SCIENCE_ILLUSTRATIONS[type];
    const [referencesExpanded, setReferencesExpanded] = useState(false);

    return (
        <>
            <GradientCard addedStyles={ styles.gradientContainer }>
                { /* The whole thing in plain language, first, in a panel of its
                     own: most people open this to decide whether the reminder
                     is worth having, not to read the papers, and that reader
                     should not have to get past a caveat to reach the answer. */ }
                <View style={ styles.tldrPanel }>
                    { /* Both appearances use an orange panel. The night theme
                         uses its darker orange fill with the pale reading ink
                         that already clears contrast on that surface. */ }
                    { theme.emphasis.rule !== null && (
                        <LinearGradient
                            colors={ theme.emphasis.rule }
                            start={ { x: 0, y: 0 } }
                            end={ { x: 1, y: 0 } }
                            style={ styles.emphasisRule }
                        />
                    ) }
                    <AppText variant="body" style={ styles.tldr }>
                        <AppText variant="body" style={ styles.tldrLabel }>{ t('tldrLabel') }</AppText>
                        { tldr }
                    </AppText>
                </View>

                <AppText variant="body" style={ styles.caveat }>
                    { t('caveat') }
                </AppText>
                <Spacer variant={ SpacerVariant.small } />

                { body.map((paragraph, index) => {
                    const illustration = illustrations?.[index];
                    return (
                        <View key={ `paragraph-${index}` }>
                            { /* Decorative: the paragraph beneath says it in words. */ }
                            { illustration && (
                                <Illustration
                                    source={ theme.scheme === 'dark' ? illustration.dark : illustration.light }
                                    testID={ `science-illustration-${index}` }
                                />
                            ) }
                            <CitedText variant="body" text={ paragraph } sources={ sources } />
                            { index < body.length - 1 && <Spacer variant={ SpacerVariant.small } /> }
                        </View>
                    );
                }) }
                <Spacer variant={ SpacerVariant.large } />
            </GradientCard>

            { sources.length > 0 && (
                <View style={ styles.sourcesSection }>
                    <Spacer variant={ SpacerVariant.large } />
                    <Pressable
                        testID="science-references-toggle"
                        accessibilityRole="button"
                        accessibilityLabel={ t('sources') }
                        accessibilityState={ { expanded: referencesExpanded } }
                        onPress={ () => setReferencesExpanded((expanded) => !expanded) }
                        style={ styles.referencesHeader }
                    >
                        <AppText variant="h3">{ t('sources') }</AppText>
                        <Ionicons
                            name={ referencesExpanded ? 'chevron-up' : 'chevron-down' }
                            size={ 22 }
                            color={ theme.ink.primary }
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        />
                    </Pressable>
                    { referencesExpanded && (
                        <View testID="science-references-list">
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
                </View>
            ) }
        </>
    );
}

/** Width over height of the square illustration renders. */
const ILLUSTRATION_ASPECT = 1;

/**
 * A picture across the column at the renders' shape, its height rounded to a
 * whole point. A fractional height (319 wide makes 191.4) leaves every
 * paragraph below it on a fractional offset, and iOS then sizes a long
 * paragraph a hair short and folds its last line into the one above.
 */
function Illustration({ source, testID }: { source: ImageSourcePropType; testID: string }) {
    const styles = useThemedStyles(makeStyles);
    const [height, setHeight] = useState(0);
    const onLayout = (event: LayoutChangeEvent) => {
        setHeight(Math.round(event.nativeEvent.layout.width / ILLUSTRATION_ASPECT));
    };

    return (
        <View style={ [styles.illustration, { height }] } onLayout={ onLayout } testID={ testID }>
            <Image source={ source } style={ StyleSheet.absoluteFill } contentFit="cover" accessible={ false } />
        </View>
    );
}

/** GradientCard's own horizontal inset, which the full-width panel reaches back through. */
const CARD_PADDING = 20;

/** And its corner radius, which the panel's top corners have to match. */
const CARD_RADIUS = 16;

const makeStyles = (theme: Theme) => StyleSheet.create({
    // A page of reading rather than a grey panel with type on it.
    gradientContainer: {
        backgroundColor: theme.surface.readingCard,
    },
    caveat: {
        fontWeight: '600',
        color: theme.ink.primary,
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
        backgroundColor: theme.scheme === 'dark' ? theme.plan.fill : theme.emphasis.panel,
        overflow: 'hidden',
    },
    emphasisRule: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    // The summary is a sentence to read, so it is set as one. Only its label is
    // bold, which is what makes the label a label.
    tldr: {
        color: theme.scheme === 'dark' ? theme.plan.inkBright : theme.emphasis.ink,
    },
    tldrLabel: {
        fontWeight: '700',
        color: theme.scheme === 'dark' ? theme.plan.inkBright : theme.emphasis.ink,
    },
    // The renders bring their own backdrop, so they only need the card's
    // rounding and a little air before the words they illustrate.
    illustration: {
        alignSelf: 'stretch',
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 14,
    },
    sourcesSection: {
        alignSelf: 'stretch',
        paddingHorizontal: 12,
    },
    referencesHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingVertical: 8,
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
