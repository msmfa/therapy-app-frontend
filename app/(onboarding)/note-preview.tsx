import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { NoteTemplateSheet } from '../../src/components/onboarding/NoteTemplateSheet';
import { NOTE_PREVIEW_COPY } from '../../src/features/onboarding/onboardingCopy';
import { TEXT_COLORS } from 'designs/designs-colors';

export default function NotePreviewScreen() {
    const router = useRouter();

    return (
        <OnboardingScreen
            backHref="/(onboarding)/plan-preview"
            headline={ NOTE_PREVIEW_COPY.headline }
            supporting={ NOTE_PREVIEW_COPY.body }
            footer={
                <Button
                    label={ NOTE_PREVIEW_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/subscription-preview') }
                />
            }
        >
            <NoteTemplateSheet />

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
    privacy: {
        marginTop: 22,
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
});
