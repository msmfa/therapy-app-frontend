import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import { NoteTemplateSheet } from '../../src/components/onboarding/NoteTemplateSheet';
import {
    NOTE_PREVIEW_COPY,
    PLAN_COPY,
    planBody,
    planHeadline,
    samplePlanBody,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
import { weekdayName } from '../../src/features/onboarding/formatting';
import { TEXT_COLORS } from 'designs/designs-colors';
import { sampleSessionAt } from '../../src/features/onboarding/samplePlan';

export default function PlanPreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();

    const isSamplePlan = answers.sessionAt === null && answers.sessionDateSkipped;
    const sessionAt = useMemo(
        () => answers.sessionAt ?? sampleSessionAt(answers.eveningMinutes),
        [answers.eveningMinutes, answers.sessionAt],
    );
    // A variable schedule has no calculable gap. For the explicitly labelled
    // sample only, show a one-week example so the user can still understand the
    // full product before booking; the example is never persisted.
    const previewCadence = isSamplePlan && answers.cadence === 'varies'
        ? 'weekly'
        : answers.cadence;

    // Only the first point: writing the note is the thing the user does, and
    // it earns the whole screen. Everything the plan does afterwards lives on
    // the next screen rather than in one list that mixes the two.
    const noteEntry = useMemo(
        () =>
            planTimeline({
                sessionAt,
                cadence: previewCadence,
                morningMinutes: answers.morningMinutes,
                eveningMinutes: answers.eveningMinutes,
            }).slice(0, 1),
        [answers.eveningMinutes, answers.morningMinutes, previewCadence, sessionAt],
    );

    return (
        <OnboardingScreen
            backHref="/(onboarding)/reminder-times"
            headline={ isSamplePlan ? PLAN_COPY.sampleHeadline : planHeadline(weekdayName(sessionAt)) }
            supporting={ isSamplePlan ? samplePlanBody(answers.cadence) : planBody(answers.cadence) }
            // The note itself, fixed to the bottom edge of the screen below
            // the point that describes it, cut off by the edge so it reads as
            // a real sheet continuing past the screen.
            bottomBackdrop={
                <View style={ styles.sheetWindow }>
                    <NoteTemplateSheet />
                </View>
            }
            bottomBackdropHeight={ SHEET_VISIBLE_HEIGHT }
            footer={
                <Button
                    label={ PLAN_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/reviews-preview') }
                />
            }
        >
            { isSamplePlan && (
                <AppText variant="caption" style={ styles.sampleLabel }>
                    { PLAN_COPY.sampleLabel }
                </AppText>
            ) }

            <View style={ styles.timeline }>
                <PlanTimeline entries={ noteEntry } />
            </View>

            <TouchableOpacity
                onPress={ () => router.push('/why-five-questions') }
                accessibilityRole="link"
                accessibilityLabel={ NOTE_PREVIEW_COPY.researchLink }
                style={ styles.researchLink }
            >
                <AppText variant="body" style={ styles.researchLinkLabel }>
                    { NOTE_PREVIEW_COPY.researchLink }
                </AppText>
                <Feather name="arrow-right" size={ 18 } color={ TEXT_COLORS.primary } />
            </TouchableOpacity>
        </OnboardingScreen>
    );
}

/** How much of the note sheet stays visible above the screen edge. */
const SHEET_VISIBLE_HEIGHT = 240;

const styles = StyleSheet.create({
    timeline: {
        marginTop: 24,
    },
    sampleLabel: {
        marginTop: 16,
        color: TEXT_COLORS.secondary,
        fontWeight: '600',
    },
    sheetWindow: {
        height: SHEET_VISIBLE_HEIGHT,
        overflow: 'hidden',
    },
    researchLink: {
        minHeight: 44,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    researchLinkLabel: {
        color: TEXT_COLORS.primary,
        textDecorationLine: 'underline',
    },
});
