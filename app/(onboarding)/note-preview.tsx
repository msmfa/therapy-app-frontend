import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/context/theme';
import { BRAND_FONTS } from 'designs/designs-typography';
import { NotificationBanner } from '../../src/components/onboarding/NotificationBanner';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import {
    goalSupport,
    notePreviewCopy,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { useOnboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { useTranslation } from 'react-i18next';

/** The screenshot's own proportions, so nothing is stretched. */
const NOTES_LIST_ASPECT = 1290 / 2194;

/** A little off level, the way a card dropped onto a table lands. */
const NOTIFICATION_TILT = '-3deg';
/** Until the banner has reported its height. */
const NOTIFICATION_HEIGHT_GUESS = 74;

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
    const { theme } = useTheme();
    const { onboardingStyles, onboardingAccentStyles } = useOnboardingStyles();
    const { t } = useTranslation('onboarding');
    const router = useRouter();
    const { answers } = useOnboardingAnswers();
    const goal = goalSupport(answers.goal);
    const { width: screenWidth } = useWindowDimensions();

    // Only while this screen is the one being looked at. A pushed screen stays
    // mounted underneath the next one, so a bar style tied to mounting alone
    // left the pale screens after this one wearing its light clock.
    const isFocused = useIsFocused();

    // Explicit numbers, not a percentage plus an aspect ratio: on the new
    // architecture that combination left the image unconstrained, so it
    // rendered at its intrinsic 1290pt and filled the screen with a corner of
    // itself. Sizes computed here cannot be misread by the layout engine.
    const imageWidth = screenWidth;
    const listHeight = Math.round(imageWidth / NOTES_LIST_ASPECT);
    // Nearly the display's width: it is a thing that has landed on top of the
    // phone, and it is the biggest thing on the page after the list itself.
    const notificationWidth = screenWidth - 8;
    const [notificationHeight, setNotificationHeight] = useState(NOTIFICATION_HEIGHT_GUESS);

    // Being prepared for the next session starts with the reminder that
    // arrives the evening before, so that goal shows the notification landing
    // over the notes. The other goals go straight to the list.
    const showsReminder = goal?.id === 'prepare';

    return (
        <>
            { /* The one dark screen in the flow: the clock and battery have to
             invert with it, and change back the moment it is left. */ }
            { isFocused && <StatusBar style="light" /> }
            <OnboardingScreen
                analyticsStep="note_preview"
                surface="accent"
                backHref="/(onboarding)/review-schedule"
                headline={ notePreviewCopy().headline }
                // Starts a margin below the content and runs to the bottom edge
                // of the screen, cut off by it, so the list reads as continuing
                // below the fold.
                bottomBackdrop={ (contentBottom) => {
                // Tight under the last card: the banner has landed on the
                // page, and a gap made it a fourth card. The raised end
                // reaches up past the card's rounded corner, where there is
                // nothing to collide with.
                    const bannerTop = contentBottom > 0 ? contentBottom + NOTIFICATION_GAP : 0;
                    // Tucked up under the banner, which lies over its top edge:
                    // the notification has landed on the list, not beside it.
                    const listTop = showsReminder
                        ? bannerTop + notificationHeight - NOTIFICATION_OVERLAP
                        : contentBottom > 0 ? contentBottom + IMAGE_GAP : 0;

                    return (
                        <>
                            <Image
                                source={ require('../../assets/illustrations/notes-list-preview.webp') as ImageSourcePropType }
                                style={ [
                                    styles.previewImage,
                                    {
                                        width: imageWidth,
                                        height: listHeight,
                                        marginTop: listTop,
                                    },
                                ] }
                                contentFit="contain"
                                accessible
                                accessibilityLabel={ t('a11y.notesList') }
                            />
                            { showsReminder && (
                                <NotificationBanner
                                    title={ notePreviewCopy().reminderTitle }
                                    body={ notePreviewCopy().reminderBody }
                                    time={ notePreviewCopy().reminderTime }
                                    width={ notificationWidth }
                                    // Placed rather than stacked, and after the list in
                                    // source order, so it is drawn over the list's edge
                                    // instead of under it.
                                    style={ [styles.notification, { top: bannerTop }] }
                                    onLayout={ (event) => setNotificationHeight(event.nativeEvent.layout.height) }
                                />
                            ) }
                        </>
                    );
                } }
                // Solid black, so the action carries its own ground: pinned
                // over the screenshot at standard text sizes and sitting on the
                // navy page at the accessibility ones, it used to need a
                // different ink for each.
                footer={
                    <OnboardingButton
                        appearance="solid"
                        label={ notePreviewCopy().primaryCta }
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
                            color={ theme.accentScreen.textSecondary }
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        />
                        <AppText
                            variant="h3"
                            style={ [onboardingStyles.title, onboardingAccentStyles.title, styles.privacyTitle] }
                            accessibilityRole="header"
                        >
                            { notePreviewCopy().privacyTitle }
                        </AppText>
                    </View>

                    <AppText variant="body" style={ [onboardingStyles.body, onboardingAccentStyles.body, styles.privacyBody] }>
                        { notePreviewCopy().privacyBody }
                    </AppText>
                </View>
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

/** Between the last card and the banner's box. */
const NOTIFICATION_GAP = 4;
/** How far the banner's box lies over the top of the list. */
const NOTIFICATION_OVERLAP = 14;

const styles = StyleSheet.create({
    // Tight. The card and the artwork are competing for one screen, and every
    // point spent on padding here is a point of the notes list that never gets
    // seen.
    privacy: {
        padding: 18,
        marginTop: 8,
    },
    privacyHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    privacyTitle: {
        flex: 1,
        fontSize: 21,
        lineHeight: 28,
    },
    /**
     * Set in the medium weight: this is the promise the screen is making about
     * where the notes live, and at the body's regular weight it read as a
     * footnote to the heading above it.
     */
    privacyBody: {
        marginTop: 8,
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
    },
    previewImage: {
        alignSelf: 'center',
        borderRadius: 28,
    },
    notification: {
        position: 'absolute',
        left: 4,
        transform: [{ rotate: NOTIFICATION_TILT }],
    },
});
