import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ACCENT_SURFACE, SURFACE_BLUE, SURFACE_BLUE_FADE } from 'designs/designs-colors';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import AppText from '../../src/components/ui/AppText';
import {
    OnboardingScreen,
    shouldUseCombinedOnboardingScroll,
} from '../../src/components/onboarding/OnboardingScreen';
import {
    goalSupport,
    NOTE_PREVIEW_COPY,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { onboardingAccentStyles, onboardingStyles } from '../../src/components/onboarding/onboardingStyles';

/** The screenshot's own proportions, so nothing is stretched. */
const NOTES_IMAGE_ASPECT = 1290 / 2194;

/**
 * The screenshot is full width and keeps its own pale ground.
 *
 * The page around it is navy, so the two do not blend and are not meant to:
 * the pale rounded panel reads as a lit phone screen resting on the page,
 * which is what it is. On the app's own pale ground the screenshot and the
 * page were the same colour and the image read as a second copy of the screen
 * it was sitting on.
 */

export default function NotePreviewScreen() {
    const router = useRouter();
    const { answers } = useOnboardingAnswers();
    const goal = goalSupport(answers.goal);
    const { width: screenWidth, fontScale } = useWindowDimensions();

    // The button is pinned over the bottom of the screenshot, which is pale, so
    // it takes the app's usual dark ink there. At the accessibility text sizes
    // the backdrop moves below the footer in one combined scroll and the button
    // sits on the navy ground instead, where the ink has to be white.
    const footerSurface = shouldUseCombinedOnboardingScroll(fontScale) ? 'accent' : 'light';

    // Only while this screen is the one being looked at. A pushed screen stays
    // mounted underneath the next one, so a bar style tied to mounting alone
    // left the pale screens after this one wearing its light clock.
    const isFocused = useIsFocused();

    // Explicit numbers, not a percentage plus an aspect ratio: on the new
    // architecture that combination left the image unconstrained, so it
    // rendered at its intrinsic 1290pt and filled the screen with a corner of
    // itself. Sizes computed here cannot be misread by the layout engine.
    const imageWidth = screenWidth;
    const imageHeight = Math.round(imageWidth / NOTES_IMAGE_ASPECT);

    return (
        <>
        { /* The one dark screen in the flow: the clock and battery have to
             invert with it, and change back the moment it is left. */ }
        { isFocused && <StatusBar style="light" /> }
        <OnboardingScreen
            surface="accent"
            backHref="/(onboarding)/reviews-preview"
            headline={ NOTE_PREVIEW_COPY.headline }
            // Starts a margin below the content and runs to the bottom edge
            // of the screen, cut off by it, so the list reads as continuing
            // below the fold.
            bottomBackdrop={ (contentBottom) => (
                <>
                <Image
                    source={ require('../../assets/illustrations/notes-list-preview.webp') as ImageSourcePropType }
                    style={ [
                        styles.previewImage,
                        {
                            width: imageWidth,
                            height: imageHeight,
                            marginTop: contentBottom > 0 ? contentBottom + IMAGE_GAP : 0,
                        },
                    ] }
                    contentFit="contain"
                    accessible
                    accessibilityLabel="A list of past therapy notes, each with the date of its session"
                />
                { /* Settles the list into the bottom of the screen instead of
                     letting the edge cut a note in half. It dissolves into the
                     screenshot's own pale ground, not the page's navy: the
                     bottom of the screen belongs to the phone in the picture,
                     and a band of navy there cut the picture short. */ }
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
            ) }
            footer={
                <OnboardingButton
                    surface={ footerSurface }
                    label={ NOTE_PREVIEW_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/subscription-preview') }
                />
            }
        >
            <View style={ [onboardingStyles.card, onboardingAccentStyles.card, styles.privacy] }>
                { /* The lock belongs to the title it marks. The paragraph runs
                     the full width underneath both, rather than in a column
                     beside the icon that cost it a word a line. */ }
                <View style={ styles.privacyHeading }>
                    <Feather
                        name="lock"
                        size={ 18 }
                        color={ ACCENT_SURFACE.textSecondary }
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                    <AppText
                        variant="h3"
                        style={ [onboardingStyles.title, onboardingAccentStyles.title, styles.privacyTitle] }
                        accessibilityRole="header"
                    >
                        { NOTE_PREVIEW_COPY.privacyTitle }
                    </AppText>
                </View>

                <AppText variant="body" style={ [onboardingStyles.body, onboardingAccentStyles.body, styles.privacyBody] }>
                    { NOTE_PREVIEW_COPY.privacyBody }
                </AppText>
            </View>

            { /* The goal, said back as a heading, and what the notes do for
                 it underneath. The screens either side describe a plan; this
                 says whose plan it is. */ }
            { goal !== null && (
                <View style={ [onboardingStyles.card, onboardingAccentStyles.card, styles.goal] }>
                    <AppText
                        variant="h3"
                        style={ [onboardingStyles.title, onboardingAccentStyles.title, styles.goalTitle] }
                        accessibilityRole="header"
                    >
                        { goal.restated }
                    </AppText>

                    <AppText
                        variant="body"
                        style={ [onboardingStyles.body, onboardingAccentStyles.body, styles.goalBody] }
                    >
                        { goal.noteSupport }
                    </AppText>
                </View>
            ) }
        </OnboardingScreen>
        </>
    );
}

/**
 * The space between the last card and the artwork's rounded top edge.
 *
 * Measured from where the content actually ends rather than set as a fraction
 * of the screen: the cards are sized by their text, so on a taller display they
 * finish in the same place and a percentage left the artwork stranded far below
 * them. The artwork's own "NOTES" heading and the blank above it are cut off,
 * so this edge is where the first note starts; the screen is titled YOUR NOTES
 * already, and repeating it inside the picture cost the list the only room it
 * had.
 */
const IMAGE_GAP = 14;

/** Set to the tallest of the three goals: a two-line title over two of body. */
const GOAL_CARD_HEIGHT = 148;

const styles = StyleSheet.create({
    // Tight, all of it. The two cards and the artwork are competing for one
    // screen, and every point spent on padding here is a point of the notes
    // list that never gets seen.
    privacy: {
        padding: 18,
        marginTop: 12,
    },
    privacyHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    privacyTitle: {
        flex: 1,
        fontSize: 17,
    },
    privacyBody: {
        marginTop: 8,
    },
    /**
     * One height whichever goal was chosen.
     *
     * The three goals are different lengths, so the card grew and shrank with
     * the answer and took the artwork below it along. A floor rather than a
     * hard height: at the accessibility text sizes the copy has to be allowed
     * to grow, and a fixed box would clip it.
     */
    goal: {
        padding: 18,
        marginTop: 12,
        minHeight: GOAL_CARD_HEIGHT,
    },
    goalTitle: {
        fontSize: 17,
    },
    goalBody: {
        marginTop: 8,
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
});
