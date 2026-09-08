import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TEXT_COLORS } from 'designs/designs-colors';
import AppText from '../../src/components/ui/AppText';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import {
    evidenceStatement,
    REVIEWS_PREVIEW_COPY,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
import { sampleSessionAt } from '../../src/features/onboarding/samplePlan';

/**
 * Everything the plan does after the note is written.
 *
 * The plan preview keeps the first point on its own, because capturing the
 * note is the one thing the user does; these are what the app does for them
 * afterwards, and a single list mixed the two together.
 *
 * The screen leads with why the moments are where they are, so the reasoning
 * is read before the list rather than found underneath it.
 *
 * Every one of these moments sits inside the gap between two sessions, which is
 * also how the server schedules them. A schedule that varies, or one not yet
 * answered, therefore has no gap to place them in, and the screen would
 * otherwise be a title and a sentence over empty space. It falls back to a
 * one-week example and labels it, rather than showing nothing.
 */
export default function ReviewsPreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();

    const isSamplePlan = answers.sessionAt === null && answers.sessionDateSkipped;
    const sessionAt = useMemo(
        () => answers.sessionAt ?? sampleSessionAt(answers.eveningMinutes),
        [answers.eveningMinutes, answers.sessionAt],
    );

    // Only a fixed cadence gives a following session, and without one there is
    // no gap and so no review to date.
    const hasKnownGap = answers.cadence !== null && answers.cadence !== 'varies';
    const previewCadence = hasKnownGap ? answers.cadence : 'weekly';

    const exampleNote = !hasKnownGap
        ? REVIEWS_PREVIEW_COPY.exampleGapNote
        : isSamplePlan
            ? REVIEWS_PREVIEW_COPY.sampleNote
            : null;

    // The first entry is the note itself and stays on the previous screen.
    const reviews = useMemo(
        () =>
            planTimeline({
                sessionAt,
                cadence: previewCadence,
                morningMinutes: answers.morningMinutes,
                eveningMinutes: answers.eveningMinutes,
            }).slice(1),
        [answers.eveningMinutes, answers.morningMinutes, previewCadence, sessionAt],
    );

    return (
        <OnboardingScreen
            analyticsStep="reviews_preview"
            backHref="/(onboarding)/plan-preview"
            headline={ REVIEWS_PREVIEW_COPY.headline }
            supporting={ evidenceStatement(answers.goal) }
            supportingAppearance="banner"
            footer={
                <OnboardingButton
                    label={ REVIEWS_PREVIEW_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/note-preview') }
                />
            }
        >
            { exampleNote !== null && (
                <View style={ [onboardingStyles.card, styles.note] }>
                    <AppText variant="caption" style={ styles.noteText }>
                        { exampleNote }
                    </AppText>
                </View>
            ) }

            <View style={ styles.timeline }>
                <PlanTimeline entries={ reviews } />
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    note: {
        padding: 16,
        marginTop: 20,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_COLORS.secondary,
    },
    timeline: {
        marginTop: 24,
        marginHorizontal: -8,
    },
});
