import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { CirclePosition } from '../../src/components/ui/LinearGradientCircle';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import {
    planCopy,
    planHeadline,
    samplePlanBody,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
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
            analyticsStep="plan_preview"
            circlePosition={ CirclePosition.BOTTOM_RIGHT }
            backHref="/(onboarding)/reminder-times"
            headline={ isSamplePlan ? planCopy().sampleHeadline : planHeadline() }
            supporting={ isSamplePlan ? samplePlanBody(answers.cadence) : undefined }
            footer={
                <OnboardingButton
                    appearance="solid"
                    label={ planCopy().primaryCta }
                    onPress={ () => router.push('/(onboarding)/note-template') }
                />
            }
        >
            <View style={ styles.timeline }>
                <PlanTimeline entries={ noteEntry } />
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    timeline: {
        marginTop: 8,
    },
});
