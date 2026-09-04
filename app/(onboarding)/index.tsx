import { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { useAuth } from '../../src/context/auth/AuthContext';
import {
    consumePendingOnboardingStep,
    peekPendingOnboardingStep,
    WELCOME_AUTH_SOURCE,
} from '../../src/features/onboarding/authReturn';
import { WELCOME_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { safeOnboardingResumeRoute } from '../../src/features/onboarding/onboardingResume';
import Loading from '../../src/components/ui/Loading';
import brainIllustration from '../../assets/illustrations/brain-elastic.svg';
import { TEXT_COLORS } from 'designs/designs-colors';

export default function WelcomeScreen() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { answers, hydrated: answersHydrated } = useOnboardingAnswers();
    const draftOwner = isAuthenticated ? `user:${user?.id ?? 'unknown'}` : 'anonymous';

    // Welcome is the initial route of this group, so it is also where the group
    // lands if signing in from the account step tore the navigator down and
    // remounted it. Resume the flow instead of restarting it. Read once on mount;
    // the pending step is cleared either way, so an abandoned sign-in (still not
    // authenticated) just shows Welcome normally. When authenticated, only
    // peek: the destination screen still needs to consume the handoff so it can
    // resume the purchase or restore action that originally opened sign-in.
    const [resumeHref] = useState<Href | null>(() => {
        if (isAuthenticated) return peekPendingOnboardingStep();
        consumePendingOnboardingStep();
        return null;
    });

    // Decide once per draft owner, and only while Welcome is focused. Welcome
    // remains mounted underneath later screens, so reacting there would yank
    // an in-progress user backwards. Re-evaluating for a new owner still lets
    // someone who signs in from Welcome resume that account's saved draft.
    const decidedDraftOwnerRef = useRef<string | null>(null);
    const [draftResumeHref, setDraftResumeHref] = useState<Href | null>(null);
    useFocusEffect(useCallback(() => {
        if (!answersHydrated || decidedDraftOwnerRef.current === draftOwner) return;
        decidedDraftOwnerRef.current = draftOwner;
        setDraftResumeHref(safeOnboardingResumeRoute(answers));
    }, [answers, answersHydrated, draftOwner]));

    if (!answersHydrated) return <Loading fullScreen />;

    if (resumeHref) {
        return <Redirect href={ resumeHref } />;
    }

    if (draftResumeHref) {
        return <Redirect href={ draftResumeHref } />;
    }

    return (
        <SafeAreaView style={ styles.safeArea } edges={ ['top', 'left', 'right', 'bottom'] }>
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <View style={ styles.wordmark } accessible accessibilityRole="header" accessibilityLabel="Plastic Brains">
                    <Image
                        source={ require('../../assets/brain-logo.png') as ImageSourcePropType }
                        style={ styles.wordmarkMark }
                        contentFit="contain"
                    />
                    <AppText variant="h2" style={ styles.wordmarkSans }>
                        Plastic
                        <AppText variant="h2" style={ styles.wordmarkSerif }> Brains</AppText>
                    </AppText>
                </View>

                <AppText
                    variant="h1"
                    style={ styles.headline }
                    accessibilityRole="header"
                >
                    { WELCOME_COPY.headline }
                </AppText>

                <AppText variant="body" style={ styles.body }>
                    { WELCOME_COPY.body }
                </AppText>

                <View style={ styles.illustrationWrapper }>
                    <Image
                        source={ brainIllustration }
                        style={ styles.illustration }
                        contentFit="contain"
                        accessible
                        accessibilityLabel="An illustration of a brain being gently stretched"
                    />
                </View>
            </ScrollView>

            <View style={ styles.footer }>
                <Button
                    label={ WELCOME_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/goal') }
                />

                <TouchableOpacity
                    onPress={ () => router.push({
                        pathname: '/(auth)/login',
                        params: { source: WELCOME_AUTH_SOURCE },
                    }) }
                    accessibilityRole="button"
                    accessibilityLabel={ WELCOME_COPY.secondaryCta }
                    style={ styles.secondaryAction }
                >
                    <AppText variant="body" style={ styles.secondaryLabel }>
                        { WELCOME_COPY.secondaryCta }
                    </AppText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    wordmark: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    wordmarkMark: {
        width: 28,
        height: 28,
    },
    wordmarkSans: {
        fontSize: 20,
        letterSpacing: -0.2,
    },
    wordmarkSerif: {
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 22,
        fontWeight: '400',
    },
    headline: {
        marginTop: 28,
        fontSize: 30,
        lineHeight: 37,
        letterSpacing: -0.5,
    },
    body: {
        marginTop: 14,
        fontSize: 17,
        lineHeight: 26,
    },
    illustrationWrapper: {
        alignItems: 'center',
        marginTop: 8,
    },
    illustration: {
        width: 320,
        height: 320,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 4,
    },
    secondaryAction: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryLabel: {
        color: TEXT_COLORS.primary,
        textDecorationLine: 'underline',
    },
});
