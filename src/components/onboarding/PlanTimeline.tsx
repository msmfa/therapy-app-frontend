import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, TEXT_COLORS } from 'designs/designs-colors';
import type { PlanTimelineEntry } from '../../features/onboarding/planTimeline';
import { occurrencesLabel } from '../../features/onboarding/formatting';
import { ReminderType } from '../../utils/types';
import { REMINDER_SCIENCE_COPY } from '../../constants/neuroReminders';
import { GlassCircleButton } from '../ui/GlassCircleButton';
import { AppModal } from '../Modal';
import { ScienceTextModal } from '../ScienceTextModal';
import { onboardingStyles, ONBOARDING_LINK_COLOR } from './onboardingStyles';
import { BRAND_FONTS } from 'designs/designs-typography';

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
function renderBody(entry: PlanTimelineEntry, onOpenTemplate?: () => void): React.ReactNode {
    const phrase = entry.bodyEmphasis;
    if (phrase === undefined) return entry.body;

    const at = entry.body.indexOf(phrase);
    if (at === -1) return entry.body;

    return (
        <>
            { entry.body.slice(0, at) }
            <AppText
                variant="body"
                style={ onOpenTemplate === undefined ? styles.emphasis : styles.bodyLink }
                onPress={ onOpenTemplate }
                accessibilityRole={ onOpenTemplate === undefined ? undefined : 'link' }
                accessibilityHint={ onOpenTemplate === undefined ? undefined : 'Opens why these five questions' }
            >
                { phrase }
            </AppText>
            { entry.body.slice(at + phrase.length) }
        </>
    );
}

export function PlanTimeline({ entries, onOpenTemplate }: Props) {
    const [openResearch, setOpenResearch] = useState<ReminderType | null>(null);
    // The rule is drawn, so it needs a number rather than a percentage: inside
    // an SVG, "100%" has no viewport to resolve against and the line stopped
    // short of the card's edge.
    const [ruleWidth, setRuleWidth] = useState(0);

    return (
        <>
            <View style={ styles.container }>
                { entries.map((entry, index) => {
                    const isLast = index === entries.length - 1;
                    const isSession = entry.id === 'log_note';
                    // The paragraph holds a link, which a collapsed accessible
                    // row would swallow.
                    const hasBodyLink = isSession && onOpenTemplate !== undefined;
                    // The name of the research on its own. "Research:" in front
                    // of it labelled a link that already sits under a paragraph
                    // of research, and cost a third of the row's width.
                    const researchLabel = entry.researchTarget === null
                        ? null
                        : REMINDER_SCIENCE_COPY[entry.researchTarget].title;

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
                                        style={ [styles.marker, { backgroundColor: ACTION_ORANGE }] }
                                    />
                                    { !isLast && <View style={ [styles.railLine, styles.railLineBelow] } /> }
                                </View>
                            ) }

                            <View
                                style={ [
                                    onboardingStyles.card,
                                    styles.content,
                                    isSession && styles.contentFullBleed,
                                ] }
                            >
                                <View style={ styles.contentColumn }>
                                <View style={ styles.heading }>
                                    { isSession && (
                                        <View
                                            style={ [styles.marker, { backgroundColor: ACTION_ORANGE }] }
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
                                </View>
                                <AppText variant="caption" style={ styles.when }>
                                    { occurrencesLabel(entry.occurrences) }
                                </AppText>
                                { /* The session's own card only. A rule between
                                     the heading and the paragraph, dotted and
                                     drawn edge to edge: the padding is
                                     cancelled so the line runs the card's full
                                     width rather than the paragraph's measure.
                                     The review cards are short enough that a
                                     rule only cut them in half. */ }
                                { isSession && <View
                                    style={ styles.bodyRule }
                                    onLayout={ (event) => setRuleWidth(event.nativeEvent.layout.width) }
                                >
                                    { ruleWidth > 0 && (
                                        <Svg width={ ruleWidth } height={ 1 }>
                                            <Line
                                                x1={ 0 }
                                                y1={ 0.5 }
                                                x2={ ruleWidth }
                                                y2={ 0.5 }
                                                stroke={ TEXT_COLORS.quaternary }
                                                strokeWidth={ 1 }
                                                strokeDasharray="2 4"
                                                strokeLinecap="round"
                                            />
                                        </Svg>
                                    ) }
                                </View> }

                                <AppText variant="body" style={ [onboardingStyles.body, styles.body] }>
                                    { renderBody(entry, isSession ? onOpenTemplate : undefined) }
                                </AppText>
                                </View>

                                { /* The whole card is the control, so the arrow
                                     is the card's own mark rather than a second
                                     target inside it: the same glass circle the
                                     flow is navigated by, turned to face
                                     forwards. Hidden from VoiceOver, which
                                     already reads the row as a link. */ }
                                { entry.researchTarget !== null && (
                                    <View
                                        style={ styles.researchArrow }
                                        accessibilityElementsHidden
                                        importantForAccessibility="no-hide-descendants"
                                    >
                                        <GlassCircleButton
                                            accessibilityLabel={ researchLabel ?? 'Research' }
                                            icon="forward"
                                            iconColor={ ONBOARDING_LINK_COLOR }
                                            size={ 40 }
                                            onPress={ () => setOpenResearch(entry.researchTarget) }
                                        />
                                    </View>
                                ) }
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
                            accessibilityHint="Opens the research for this reminder"
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
                    title={ REMINDER_SCIENCE_COPY[openResearch].title }
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

/** The gutter the screen sets its content in, cancelled by the full-bleed row. */
const SCREEN_PADDING = 24;

const styles = StyleSheet.create({
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
        backgroundColor: 'hsla(0, 0%, 0%, 0.07)',
    },
    /** Reaches the dot from the top of the row, level with the card's title. */
    railLineAbove: {
        width: 2,
        height: 24,
    },
    railLineBelow: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: CARD_PADDING,
        marginBottom: 16,
        // Brighter than the flow's shared card edge. These sit over artwork
        // and over the rail, and the highlight is what lifts them off both.
        borderColor: 'hsla(0, 0%, 100%, 0.85)',
        flexDirection: 'row',
        // Top right, level with the label: the arrow marks the card, and level
        // with the middle of a paragraph it read as though it belonged to
        // whichever line it happened to land beside.
        alignItems: 'flex-start',
        gap: 12,
    },
    /**
     * The session's card is a band, not a card: it runs edge to edge of the
     * display with square corners. It is the one thing on its screen, and a
     * rounded panel with a margin either side made it a card among cards on a
     * screen that has no others.
     */
    contentFullBleed: {
        marginHorizontal: -SCREEN_PADDING,
        borderRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    contentColumn: {
        flex: 1,
    },
    // Pulled back into the card's corner: at the full inset the arrow sat a
    // long way in from two edges it is supposed to mark.
    researchArrow: {
        flexShrink: 0,
        marginTop: -8,
        marginRight: -8,
    },
    label: {
        flexShrink: 1,
        fontSize: 17,
        lineHeight: 23,
    },
    /** The session's own row is the whole of its screen, so it leads louder. */
    labelSession: {
        fontSize: 21,
        lineHeight: 28,
    },
    when: {
        marginTop: 2,
        color: TEXT_COLORS.tertiary,
    },
    // Larger than the flow's body copy: this paragraph is the card, and at the
    // shared 16pt it read as a caption under the label rather than the thing
    // the card is there to say.
    /** Out through the card's own padding, so the rule meets both edges. */
    bodyRule: {
        marginTop: 12,
        marginHorizontal: -CARD_PADDING,
        height: 1,
    },
    body: {
        marginTop: 12,
        fontSize: 18,
        lineHeight: 27,
    },
    /**
     * The brand faces ship no italic, so this is the system's slant over the
     * same family. It only ever carries a short phrase, never a paragraph.
     */
    emphasis: {
        fontStyle: 'italic',
    },
    /**
     * The flow's link colour and weight, inside a sentence. No trailing arrow:
     * an arrow mid-paragraph reads as punctuation, and the phrase is a proper
     * noun, which is cue enough alongside the colour.
     */
    bodyLink: {
        color: ONBOARDING_LINK_COLOR,
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
    },
});
