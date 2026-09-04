import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import { QuoteCard } from '../../src/components/onboarding/QuoteCard';
import {
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

    const entries = useMemo(
        () =>
            planTimeline({
                sessionAt,
                cadence: previewCadence,
                morningMinutes: answers.morningMinutes,
                eveningMinutes: answers.eveningMinutes,
            }),
        [answers.eveningMinutes, answers.morningMinutes, previewCadence, sessionAt],
    );

    return (
        <OnboardingScreen
            backHref="/(onboarding)/reminder-times"
            headline={ isSamplePlan ? PLAN_COPY.sampleHeadline : planHeadline(weekdayName(sessionAt)) }
            supporting={ isSamplePlan ? samplePlanBody(answers.cadence) : planBody(answers.cadence) }
            footer={
                <Button
                    label={ PLAN_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/note-preview') }
                />
            }
        >
            { isSamplePlan && (
                <AppText variant="caption" style={ styles.sampleLabel }>
                    { PLAN_COPY.sampleLabel }
                </AppText>
            ) }

            <View style={ styles.timeline }>
                <PlanTimeline entries={ entries } />
            </View>

            <View style={ styles.research }>
                <AppText variant="h3" style={ styles.researchTitle }>
                    { PLAN_COPY.researchTitle }
                </AppText>
                <AppText variant="body" style={ styles.researchBody }>
                    { PLAN_COPY.researchBody }
                </AppText>
                <AppText variant="caption" style={ styles.evidence }>
                    { PLAN_COPY.evidenceStatement }
                </AppText>
            </View>

            <View style={ styles.quote }>
                <QuoteCard
                    quote={ PLAN_COPY.testimonial.quote }
                    name={ PLAN_COPY.testimonial.name }
                    role={ PLAN_COPY.testimonial.role }
                />
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    timeline: {
        marginTop: 24,
    },
    sampleLabel: {
        marginTop: 16,
        color: TEXT_COLORS.secondary,
        fontWeight: '600',
    },
    research: {
        marginTop: 4,
    },
    researchTitle: {
        fontSize: 17,
    },
    researchBody: {
        marginTop: 6,
    },
    evidence: {
        marginTop: 10,
        color: TEXT_COLORS.secondary,
    },
    quote: {
        marginTop: 20,
    },
});
