import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import {
    PLAN_COPY,
    planHeadline,
    samplePlanBody,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
import { sampleSessionAt } from '../../src/features/onboarding/samplePlan';

export default function PlanPreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();
    const { width: screenWidth } = useWindowDimensions();

    // Plain numbers: a percentage width plus an aspect ratio leaves an Image
    // unconstrained on the new architecture and it renders at intrinsic size.
    const imageWidth = screenWidth;
    const imageHeight = Math.round(imageWidth / IMAGE_ASPECT);

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
            backHref="/(onboarding)/reminder-times"
            headline={ isSamplePlan ? PLAN_COPY.sampleHeadline : planHeadline() }
            supporting={ isSamplePlan ? samplePlanBody(answers.cadence) : undefined }
            // The note itself, as a background image behind the content,
            // tilted a little so it reads as a sheet lying on the surface.
            bottomBackdrop={ (contentBottom) => (
                <Image
                    source={ require('../../assets/illustrations/note-cheatsheet-preview.webp') as ImageSourcePropType }
                    style={ [
                        styles.sheetImage,
                        {
                            width: imageWidth,
                            height: imageHeight,
                            marginTop: contentBottom > 0 ? contentBottom + IMAGE_GAP : 0,
                        },
                    ] }
                    contentFit="contain"
                    accessible
                    accessibilityLabel="The five-question note sheet"
                />
            ) }
            footer={
                <OnboardingButton
                    appearance="solid"
                    label={ PLAN_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/reviews-preview') }
                />
            }
        >
            <View style={ styles.timeline }>
                <PlanTimeline
                    entries={ noteEntry }
                    onOpenTemplate={ () => router.push('/why-five-questions') }
                />
            </View>
        </OnboardingScreen>
    );
}

/** The cheat sheet's own proportions, so nothing is stretched. */
const IMAGE_ASPECT = 1290 / 2661;

/**
 * The space between the band above and the sheet's rounded top edge.
 *
 * Measured from where the content actually ends rather than set as a fraction
 * of the screen: the band is sized by its paragraph, so on a taller display it
 * finishes in the same place and a percentage left the sheet stranded below it.
 * The artwork carries only a hair of blank paper above its title, so this edge
 * is very nearly where the sheet's first words fall.
 */
const IMAGE_GAP = 16;

const styles = StyleSheet.create({
    timeline: {
        marginTop: 8,
    },
    sheetImage: {
        transform: [{ rotate: '2.5deg' }],
        borderRadius: 28,
    },
});
