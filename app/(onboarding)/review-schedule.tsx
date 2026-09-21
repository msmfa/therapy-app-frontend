import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TEXT_COLORS } from 'designs/designs-colors';
import AppText from '../../src/components/ui/AppText';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import { reviewScheduleCopy } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
import { sampleSessionAt } from '../../src/features/onboarding/samplePlan';

/**
 * Every moment the app will reach the user between two sessions, dated.
 *
 * The screen before this one gives the reason the moments are where they are,
 * in a single band of orange. This is the list itself. They were one screen,
 * where the reasoning was read as a caption over a list rather than as the
 * answer to the question the list raises.
 *
 * Every one of these sits inside the gap between two sessions, which is also
 * how the server schedules them. A schedule that varies, or one not yet
 * answered, therefore has no gap to place them in, and the screen would
 * otherwise be a title over empty space. It falls back to a one-week example
 * and labels it, rather than showing nothing.
 */
export default function ReviewScheduleScreen() {
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
        ? reviewScheduleCopy().exampleGapNote
        : isSamplePlan
            ? reviewScheduleCopy().sampleNote
            : null;

    // The first entry is the note itself, which belongs to the plan screen.
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
            analyticsStep="review_schedule"
            backHref="/(onboarding)/reviews-preview"
            headline={ reviewScheduleCopy().headline }
            footer={
                <OnboardingButton
                    label={ reviewScheduleCopy().primaryCta }
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
        marginTop: 8,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_COLORS.secondary,
    },
    timeline: {
        marginTop: 0,
        marginHorizontal: -8,
    },
});
