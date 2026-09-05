import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import {
    PLAN_COPY,
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
 */
export default function ReviewsPreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();

    const isSamplePlan = answers.sessionAt === null && answers.sessionDateSkipped;
    const sessionAt = useMemo(
        () => answers.sessionAt ?? sampleSessionAt(answers.eveningMinutes),
        [answers.eveningMinutes, answers.sessionAt],
    );
    const previewCadence = isSamplePlan && answers.cadence === 'varies'
        ? 'weekly'
        : answers.cadence;

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
            backHref="/(onboarding)/plan-preview"
            headline={ REVIEWS_PREVIEW_COPY.headline }
            supporting={ PLAN_COPY.evidenceStatement }
            footer={
                <Button
                    label={ REVIEWS_PREVIEW_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/note-preview') }
                />
            }
        >
            <View style={ styles.timeline }>
                <PlanTimeline entries={ reviews } />
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    timeline: {
        marginTop: 24,
    },
});
