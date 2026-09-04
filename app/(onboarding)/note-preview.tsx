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

/** The scroll padding this screen's image deliberately breaks out of. */
const CONTENT_PADDING = 24;

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

            { /* Runs off the bottom of the screen on purpose: the list carries
                 on past the fold, which says "these accumulate" better than a
                 neatly framed thumbnail would. Breaks out of the scroll
                 padding so it reaches all three edges. */ }
            <View style={ styles.previewWindow }>
                <Image
                    source={ require('../../assets/illustrations/notes-list-preview.png') as ImageSourcePropType }
                    style={ styles.previewImage }
                    resizeMode="cover"
                    accessible
                    accessibilityLabel="A list of past therapy notes, each with the date of its session"
                />
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
        marginTop: 24,
        marginHorizontal: -CONTENT_PADDING,
        // Cancels the scroll's bottom padding so the image meets the edge.
        marginBottom: -CONTENT_PADDING,
        height: 260,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        // Taller than the window, anchored at the top, so the list is cut off
        // rather than squashed.
        height: 560,
    },
});
