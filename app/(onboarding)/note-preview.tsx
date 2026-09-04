import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import {
    NOTE_PREVIEW_COPY,
    notePreviewBody,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { TEXT_COLORS } from 'designs/designs-colors';

/** The screenshot's own proportions, so nothing is stretched. */
const NOTES_IMAGE_ASPECT = 1290 / 2616;

/**
 * The screenshot's scale on screen.
 *
 * At full width a screenshot of a phone renders its interface life-size, which
 * reads as a second screen pasted over this one rather than an illustration of
 * it. Scaled down it becomes a picture of the notes list. The gap this leaves
 * at the sides is invisible: the screenshot's own background is SURFACE_BLUE,
 * the same colour this screen sits on.
 */
const IMAGE_SCALE = 0.7;

/**
 * How much of the screenshot to leave visible.
 *
 * Measured against the artwork: the first note card runs from 435 to 1085 in
 * the trimmed image, and at IMAGE_SCALE of a 390pt screen this cuts it at its
 * midpoint. The card is visibly mid-sentence at the edge, which is the point;
 * any more and it reads as a framed thumbnail rather than a list carrying on
 * past the screen.
 */
const VISIBLE_HEIGHT = 165;

export default function NotePreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();

    return (
        <OnboardingScreen
            backHref="/(onboarding)/reviews-preview"
            headline={ NOTE_PREVIEW_COPY.headline }
            // Answers the goal chosen in the first question rather than
            // describing the notes the same way to everyone.
            supporting={ notePreviewBody(answers.goal) }
            // Fixed to the bottom edge of the screen rather than placed in the
            // flow, where it ended wherever the content happened to end. The
            // first note is cut at its midpoint by the screen edge, so the
            // list reads as continuing below it.
            bottomBackdrop={
                <View style={ styles.previewWindow }>
                    <Image
                        source={ require('../../assets/illustrations/notes-list-preview.png') as ImageSourcePropType }
                        style={ styles.previewImage }
                        resizeMode="contain"
                        accessible
                        accessibilityLabel="A list of past therapy notes, each with the date of its session"
                    />
                </View>
            }
            bottomBackdropHeight={ VISIBLE_HEIGHT }
            footer={
                <Button
                    label={ NOTE_PREVIEW_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/subscription-preview') }
                />
            }
        >
            <View style={ styles.privacy }>
                <Feather
                    name="lock"
                    size={ 18 }
                    color={ TEXT_COLORS.secondary }
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                />
                <View style={ styles.privacyText }>
                    <AppText variant="h3" style={ styles.privacyTitle } accessibilityRole="header">
                        { NOTE_PREVIEW_COPY.privacyTitle }
                    </AppText>
                    <AppText variant="body" style={ styles.privacyBody }>
                        { NOTE_PREVIEW_COPY.privacyBody }
                    </AppText>
                </View>
            </View>

        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    privacy: {
        marginTop: 24,
        flexDirection: 'row',
        gap: 12,
    },
    privacyText: {
        flex: 1,
    },
    privacyTitle: {
        fontSize: 17,
    },
    privacyBody: {
        marginTop: 4,
    },
    previewWindow: {
        height: VISIBLE_HEIGHT,
        overflow: 'hidden',
    },
    previewImage: {
        // Absolute, so the window's height clips the image from the top rather
        // than squashing it. resizeMode "cover" centred the crop, which showed
        // the middle of the list instead of the top of it. Inset from both
        // sides equally to render at IMAGE_SCALE, centred.
        position: 'absolute',
        top: 0,
        left: `${(100 * (1 - IMAGE_SCALE)) / 2}%`,
        right: `${(100 * (1 - IMAGE_SCALE)) / 2}%`,
        aspectRatio: NOTES_IMAGE_ASPECT,
    },
});
