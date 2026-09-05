import { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { PlanTimeline } from '../../src/components/onboarding/PlanTimeline';
import {
    NOTE_PREVIEW_COPY,
    PLAN_COPY,
    planHeadline,
    samplePlanBody,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from '../../src/features/onboarding/planTimeline';
import { TEXT_COLORS } from 'designs/designs-colors';
import { sampleSessionAt } from '../../src/features/onboarding/samplePlan';

export default function PlanPreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Plain numbers: a percentage width plus an aspect ratio leaves an Image
    // unconstrained on the new architecture and it renders at intrinsic size.
    const imageWidth = screenWidth;
    const imageTop = Math.round(screenHeight * IMAGE_TOP_FRACTION);
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
            backHref="/(onboarding)/reminder-times"
            headline={ isSamplePlan ? PLAN_COPY.sampleHeadline : planHeadline() }
            supporting={ isSamplePlan ? samplePlanBody(answers.cadence) : undefined }
            // The note itself, as a background image behind the content,
            // tilted a little so it reads as a sheet lying on the surface.
            bottomBackdrop={
                <Image
                    source={ require('../../assets/illustrations/note-cheatsheet-preview.png') as ImageSourcePropType }
                    style={ [styles.sheetImage, { width: imageWidth, height: imageHeight, marginTop: imageTop }] }
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="The five-question note sheet"
                />
            }
            footer={
                <OnboardingButton
                    label={ PLAN_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/reviews-preview') }
                />
            }
        >
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

/** Matches the notes screen, so the two artworks sit identically. */
const IMAGE_ASPECT = 1290 / 2796;

/**
 * Where the artwork's rounded top edge sits, as a fraction of screen height.
 * The image is full width and taller than the space below this line, so the
 * screen's bottom edge cuts it, never its own frame.
 */
const IMAGE_TOP_FRACTION = 0.46;

const styles = StyleSheet.create({
    timeline: {
        marginTop: 24,
    },
    sheetImage: {
        transform: [{ rotate: '2.5deg' }],
        borderRadius: 28,
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
