import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, CALENDAR_DARK_COLORS, TEXT_COLORS } from 'designs/designs-colors';
import type { PlanTimelineEntry } from '../../features/onboarding/planTimeline';
import { occurrencesLabel } from '../../features/onboarding/formatting';
import { ReminderType } from '../../utils/types';
import { REMINDER_SCIENCE_COPY } from '../../constants/neuroReminders';
import { AppModal } from '../Modal';
import { ScienceTextModal } from '../ScienceTextModal';
import { onboardingStyles } from './onboardingStyles';

type Props = {
    entries: PlanTimelineEntry[];
};

/**
 * The plan as a vertical timeline.
 *
 * The prompt tied directly to the session is marked in the app's therapy orange
 * and the later reviews in reminder blue, matching the calendar's dots so the
 * two screens describe the same plan in the same language.
 */
export function PlanTimeline({ entries }: Props) {
    const [openResearch, setOpenResearch] = useState<ReminderType | null>(null);

    return (
        <>
            <View style={ styles.container }>
                { entries.map((entry, index) => {
                    const isLast = index === entries.length - 1;
                    const isSession = entry.id === 'log_note';
                    const researchLabel = entry.researchTarget === null
                        ? null
                        : `Research: ${REMINDER_SCIENCE_COPY[entry.researchTarget].title}`;

                    const rowContent = (
                        <>
                            <View style={ styles.rail }>
                                <View
                                    style={ [
                                        styles.marker,
                                        { backgroundColor: isSession ? ACTION_ORANGE : CALENDAR_DARK_COLORS.reminderDot },
                                    ] }
                                />
                                { !isLast && <View style={ styles.railLine } /> }
                            </View>

                            <View style={ [onboardingStyles.card, styles.content] }>
                                <AppText variant="h3" style={ [onboardingStyles.title, styles.label] }>
                                    { entry.label }
                                </AppText>
                                <AppText variant="caption" style={ styles.when }>
                                    { occurrencesLabel(entry.occurrences) }
                                </AppText>
                                <AppText variant="body" style={ [onboardingStyles.body, styles.body] }>
                                    { entry.body }
                                </AppText>
                                { researchLabel !== null && (
                                    <View style={ styles.researchLink }>
                                        <AppText variant="caption" style={ styles.researchLinkLabel }>
                                            { researchLabel }
                                        </AppText>
                                        <Feather name="arrow-right" size={ 16 } color={ TEXT_COLORS.secondary } />
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
                                accessible
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
    marker: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 24,
    },
    railLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: 'hsla(0, 0%, 0%, 0.12)',
    },
    content: {
        flex: 1,
        padding: 20,
        marginBottom: 16,
    },
    label: {
        fontSize: 17,
        lineHeight: 23,
    },
    when: {
        marginTop: 2,
        color: TEXT_COLORS.tertiary,
    },
    body: {
        marginTop: 4,
    },
    researchLink: {
        minHeight: 36,
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    researchLinkLabel: {
        flexShrink: 1,
        color: TEXT_COLORS.secondary,
        textDecorationLine: 'underline',
    },
});
