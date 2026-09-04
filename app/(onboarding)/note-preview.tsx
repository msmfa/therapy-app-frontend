import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QuoteCard } from '../../src/components/onboarding/QuoteCard';
import { SURFACE_BLUE, SURFACE_BLUE_FADE } from 'designs/designs-colors';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { NOTE_PREVIEW_COPY } from '../../src/features/onboarding/onboardingCopy';
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

export default function NotePreviewScreen() {
    const router = useRouter();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Explicit numbers, not a percentage plus an aspect ratio: on the new
    // architecture that combination left the image unconstrained, so it
    // rendered at its intrinsic 1290pt and filled the screen with a corner of
    // itself. Sizes computed here cannot be misread by the layout engine.
    const imageWidth = screenWidth;
    const imageTop = Math.round(screenHeight * IMAGE_TOP_FRACTION);
    const imageHeight = Math.round(imageWidth / NOTES_IMAGE_ASPECT);

    return (
        <OnboardingScreen
            backHref="/(onboarding)/reviews-preview"
            headline={ NOTE_PREVIEW_COPY.headline }
            // Starts a margin below the content and runs to the bottom edge
            // of the screen, cut off by it, so the list reads as continuing
            // below the fold.
            bottomBackdrop={
                <>
                <Image
                    source={ require('../../assets/illustrations/notes-list-preview.png') as ImageSourcePropType }
                    style={ [styles.previewImage, { width: imageWidth, height: imageHeight, marginTop: imageTop }] }
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="A list of past therapy notes, each with the date of its session"
                />
                { /* Settles the list into the page just above the button. */ }
                <LinearGradient
                    colors={ [SURFACE_BLUE_FADE, SURFACE_BLUE, SURFACE_BLUE] }
                    // Fully solid by halfway down, so the dissolve is finished
                    // just above the button rather than at the screen edge
                    // behind it.
                    locations={ [0, 0.55, 1] }
                    style={ styles.fade }
                    pointerEvents="none"
                />
                </>
            }
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

            <View style={ styles.quote }>
                <QuoteCard
                    quote={ NOTE_PREVIEW_COPY.testimonial.quote }
                    name={ NOTE_PREVIEW_COPY.testimonial.name }
                    role={ NOTE_PREVIEW_COPY.testimonial.role }
                />
            </View>
        </OnboardingScreen>
    );
}

/**
 * Where the artwork's rounded top edge sits, as a fraction of screen height.
 * The image is full width and taller than the space below this line, so the
 * screen's bottom edge cuts it, never its own frame.
 */
const IMAGE_TOP_FRACTION = 0.46;

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
    previewImage: {
        alignSelf: 'center',
        borderRadius: 28,
    },
    fade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 260,
    },
    quote: {
        marginTop: 20,
    },
});
