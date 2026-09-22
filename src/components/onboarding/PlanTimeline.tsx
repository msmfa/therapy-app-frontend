import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '../ui/AppText';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import type { PlanTimelineEntry } from '../../features/onboarding/planTimeline';
import { occurrencesLabel } from '../../features/onboarding/formatting';
import { ReminderType } from '../../utils/types';
import { reminderScienceCopy } from '../../constants/neuroReminders';
import { GlassCircleButton } from '../ui/GlassCircleButton';
import { DottedDivider } from '../ui/DottedDivider';
import { AppModal } from '../Modal';
import { ScienceTextModal } from '../ScienceTextModal';
import { useOnboardingStyles, type OnboardingStyles } from './onboardingStyles';
import { BRAND_FONTS } from 'designs/designs-typography';
import { useTranslation } from 'react-i18next';
import { t as translate } from '../../i18n/translate';

type Props = {
    entries: PlanTimelineEntry[];
    /**
     * Opens the note template's explanation.
     *
     * When given, the phrase naming the template inside the paragraph becomes
     * the link to it. The template is what the session's step is about, so the
     * words that name it are the thing to press; a separate link underneath was
     * a second way of saying the same sentence.
     */
    onOpenTemplate?: () => void;
};

/**
 * The plan as a vertical timeline.
 *
 * The prompt tied directly to the session is marked in the app's therapy orange
 * and the later reviews in reminder blue, matching the calendar's dots so the
 * two screens describe the same plan in the same language.
 *
 * The session's own step carries its orange dot inside the card, beside the
 * label it belongs to. It is only ever shown on its own, where a rail with a
 * single dot and no line to draw was an empty column holding a stray mark.
 */
/**
 * An entry's paragraph, with the phrase naming the note template set as a link
 * to it.
 *
 * Split rather than marked up, so the copy stays one readable sentence in the
 * file it is written in instead of a list of fragments. Without a handler the
 * phrase is still emphasised, so the template reads as a named thing whether or
 * not there is anywhere to go.
 */
type Sheets = {
    styles: ReturnType<typeof makeStyles>;
    onboardingStyles: OnboardingStyles['onboardingStyles'];
};

function renderParagraph(
    paragraph: string,
    phrase: string | undefined,
    isSession: boolean,
    { styles, onboardingStyles }: Sheets,
    onOpenTemplate?: () => void,
): React.ReactNode {
    if (phrase === undefined) return paragraph;

    const at = paragraph.indexOf(phrase);
    if (at === -1) return paragraph;

    // The sentence's own size and ink, then the mark on top of it: the phrase
    // is part of the paragraph, and set a size smaller or a shade lighter than
    // the words either side of it, it read as a different voice.
    const phraseStyle = [
        onboardingStyles.body,
        styles.bodyCopy,
        isSession && styles.bodySession,
        onOpenTemplate === undefined ? styles.emphasis : styles.bodyLink,
    ];

    return (
        <>
            { paragraph.slice(0, at) }
            <AppText
                variant="body"
                style={ phraseStyle }
                onPress={ onOpenTemplate }
                accessibilityRole={ onOpenTemplate === undefined ? undefined : 'link' }
                accessibilityHint={ onOpenTemplate === undefined ? undefined : translate('onboarding:timeline.opensFiveQuestions') }
            >
                { phrase }
            </AppText>
            { paragraph.slice(at + phrase.length) }
        </>
    );
}

/**
 * The entry's paragraphs, each as its own block.
 *
 * A blank line in the resource string is the break. Separate Text blocks
 * rather than the newlines rendered inline, so the space between paragraphs is
 * set here and does not inherit whatever line height the copy happens to have.
 */
function renderBody(entry: PlanTimelineEntry, sheets: Sheets, onOpenTemplate?: () => void): React.ReactNode[] {
    const { styles, onboardingStyles } = sheets;
    const isSession = entry.id === 'log_note';

    return entry.body.split('\n\n').map((paragraph, index) => {
        const paragraphStyle = [
            onboardingStyles.body,
            styles.bodyCopy,
            isSession && styles.bodySession,
            index === 0 ? styles.body : styles.bodyParagraph,
        ];

        return (
            <AppText key={ paragraph } variant="body" style={ paragraphStyle }>
                { renderParagraph(paragraph, entry.bodyEmphasis, isSession, sheets, onOpenTemplate) }
            </AppText>
        );
    });
}

export function PlanTimeline({ entries, onOpenTemplate }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { onboardingStyles, linkColor } = useOnboardingStyles();
    const sheets: Sheets = { styles, onboardingStyles };
    const { t } = useTranslation('onboarding');
    const [openResearch, setOpenResearch] = useState<ReminderType | null>(null);

    return (
        <>
            <View style={ styles.container }>
                { entries.map((entry, index) => {
                    const isLast = index === entries.length - 1;
                    const isSession = entry.id === 'log_note';
                    // The paragraph holds a link, which a collapsed accessible
                    // row would swallow.
                    const hasBodyLink = isSession && onOpenTemplate !== undefined;
                    // The name of the research on its own. { t('timeline.researchLabel') } in front
                    // of it labelled a link that already sits under a paragraph
                    // of research, and cost a third of the row's width.
                    const researchLabel = entry.researchTarget === null
                        ? null
                        : reminderScienceCopy()[entry.researchTarget].title;

                    const rowContent = (
                        <>
                            { !isSession && (
                                <View style={ styles.rail }>
                                    { /* The line is drawn in three parts rather
                                         than one: a length above the marker, the
                                         marker, and a length below it that runs
                                         to the bottom of the row. The row's own
                                         height includes the card's bottom
                                         margin, so consecutive rows meet with
                                         nothing between them. */ }
                                    { /* A line on every row but the first, which
                                         holds the same height open so its dot
                                         still lands level with the title. */ }
                                    <View
                                        style={ [
                                            styles.railLineAbove,
                                            index > 0 ? styles.railLine : null,
                                        ] }
                                    />
                                    <View
                                        style={ [styles.marker, { backgroundColor: theme.accent.mark }] }
                                    />
                                    { !isLast && <View style={ [styles.railLine, styles.railLineBelow] } /> }
                                </View>
                            ) }

                            <View
                                style={ [
                                    onboardingStyles.card,
                                    styles.content,
                                    !isSession && styles.contentCompact,
                                ] }
                            >
                                <View style={ styles.heading }>
                                    { isSession && (
                                        <View
                                            style={ [styles.marker, { backgroundColor: theme.accent.mark }] }
                                        />
                                    ) }
                                    <AppText
                                        variant="h3"
                                        style={ [
                                            onboardingStyles.title,
                                            styles.label,
                                            isSession && styles.labelSession,
                                        ] }
                                    >
                                        { entry.label }
                                    </AppText>

                                    { /* Only the heading shares width with
                                         the arrow; the paragraph below
                                         uses the whole card. */ }
                                    { entry.researchTarget !== null && (
                                        <View
                                            style={ styles.researchArrow }
                                            accessibilityElementsHidden
                                            importantForAccessibility="no-hide-descendants"
                                        >
                                            <GlassCircleButton
                                                accessibilityLabel={ researchLabel ?? t('timeline.research') }
                                                icon="forward"
                                                iconColor={ linkColor }
                                                size={ 40 }
                                                onPress={ () => setOpenResearch(entry.researchTarget) }
                                            />
                                        </View>
                                    ) }
                                </View>
                                <AppText variant="caption" style={ styles.when }>
                                    { occurrencesLabel(entry.occurrences) }
                                </AppText>
                                { /* The session's own card only. A dotted rule
                                     between the heading and the paragraphs,
                                     set to the card's own measure: the panel
                                     is rounded, and a line run out to its
                                     edges crossed the corner radius. The
                                     review cards are short enough that a rule
                                     only cut them in half. */ }
                                { isSession && <DottedDivider style={ styles.bodyRule } /> }

                                { renderBody(entry, sheets, isSession ? onOpenTemplate : undefined) }
                            </View>
                        </>
                    );

                    if (entry.researchTarget === null) {
                        return (
                            <View
                                key={ `${entry.id}-${entry.at.toISOString()}` }
                                style={ styles.row }
                                accessible={ !hasBodyLink }
                            >
                                { rowContent }
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={ `${entry.id}-${entry.at.toISOString()}` }
                            style={ styles.row }
                            activeOpacity={ 0.75 }
                            accessibilityRole="link"
                            accessibilityLabel={ `${entry.label}. ${occurrencesLabel(entry.occurrences)}. ${entry.body} ${researchLabel}` }
                            accessibilityHint={ t('timeline.opensResearch') }
                            onPress={ () => setOpenResearch(entry.researchTarget) }
                        >
                            { rowContent }
                        </TouchableOpacity>
                    );
                }) }
            </View>

            { openResearch !== null && (
                <AppModal
                    isVisible
                    title={ reminderScienceCopy()[openResearch].title }
                    onClose={ () => setOpenResearch(null) }
                >
                    <ScienceTextModal type={ openResearch } />
                </AppModal>
            ) }
        </>
    );
}

/** The card's inset, which the full-width rule has to reach back through. */
const CARD_PADDING = 20;

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 14,
    },
    rail: {
        alignItems: 'center',
        width: 14,
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    marker: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    railLine: {
        width: 2,
        // Lighter than the type it runs beside: the line is there to show that
        // the points belong to one sequence, not to be read itself.
        backgroundColor: theme.hairlineFaint,
    },
    /** Reaches the dot from the top of the row, level with the card's title. */
    railLineAbove: {
        width: 2,
        height: 24,
    },
    railLineBelow: {
        flex: 1,
    },
    /**
     * The review rows are a label, a date and a sentence, and they are read as
     * a list. The session's own card keeps the full inset: it is the only thing
     * on its screen.
     */
    contentCompact: {
        paddingVertical: 14,
        marginBottom: 12,
    },
    content: {
        flex: 1,
        padding: CARD_PADDING,
        marginBottom: 16,
        // Brighter than the flow's shared card edge. These sit over artwork
        // and over the rail, and the highlight is what lifts them off both.
        borderColor: theme.surface.cardHighlight,
    },
    // Pulled back into the card's corner: at the full inset the arrow sat a
    // long way in from two edges it is supposed to mark.
    researchArrow: {
        flexShrink: 0,
        marginTop: -8,
        marginRight: -8,
    },
    label: {
        flex: 1,
        fontSize: 17,
        lineHeight: 23,
    },
    /** The session's own row is the whole of its screen, so it leads louder. */
    labelSession: {
        fontSize: 19,
        lineHeight: 26,
    },
    // The date sits under the label it belongs to and behind the paragraph in
    // importance, so it steps back a shade further than the flow's captions.
    when: {
        marginTop: 0,
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink.quaternary,
    },
    // Larger than the flow's body copy: this paragraph is the card, and at the
    // shared 16pt it read as a caption under the label rather than the thing
    // the card is there to say.
    bodyRule: {
        marginTop: 20,
        height: 1,
    },
    body: {
        marginTop: 6,
    },
    /** Between paragraphs inside one card, which are closer than cards are. */
    bodyParagraph: {
        marginTop: 14,
    },
    bodyCopy: {
        fontSize: 18,
        lineHeight: 27,
    },
    /**
     * The session's card is the only thing on its screen and its paragraphs are
     * what the screen is for, so they take the page's full-strength ink rather
     * than the body's step-back grey, and a point more than the review rows.
     */
    bodySession: {
        fontSize: 19,
        lineHeight: 28,
        color: theme.ink.primary,
    },
    /**
     * The brand faces ship no italic, so this is the system's slant over the
     * same family. It only ever carries a short phrase, never a paragraph.
     */
    emphasis: {
        fontStyle: 'italic',
    },
    /**
     * The sentence's own metrics, with just a medium weight and black ink to
     * distinguish the link without making it look like a different paragraph.
     */
    bodyLink: {
        color: theme.ink.primary,
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
    },
});
