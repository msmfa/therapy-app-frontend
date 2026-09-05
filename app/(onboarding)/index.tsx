import { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
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
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from '../../src/components/ui/LinearGradientCircle';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { shouldUseCombinedOnboardingScroll } from '../../src/components/onboarding/OnboardingScreen';

export default function WelcomeScreen() {
    const router = useRouter();
    const { width, height, fontScale } = useWindowDimensions();
    const useCombinedScroll = shouldUseCombinedOnboardingScroll(fontScale);
    const compact = height < 750;
    const illustrationSize = Math.min(320, height * (compact ? 0.24 : 0.28), Math.max(0, width - 96));
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

    const footer = (
        <View style={ styles.footer }>
            <OnboardingButton
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
    );

    return (
        <View style={ styles.safeArea }>
            <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_RIGHT } />
            <SafeAreaView style={ styles.safeArea } edges={ ['top', 'left', 'right', 'bottom'] }>
                <ScrollView
                    style={ styles.scroll }
                    contentContainerStyle={ styles.scrollContent }
                    showsVerticalScrollIndicator={ false }
                >
                    <View style={ styles.wordmark } accessible accessibilityRole="header" accessibilityLabel="Plastic Brains">
                        { /* A cut-out of the same mark, kept as a separate file on
                             purpose. brain-logo.png is also the app icon, and iOS
                             rejects an icon containing an alpha channel, so the
                             two cannot be the same asset. */ }
                        <Image
                            source={ require('../../assets/brain-logo-transparent.png') as ImageSourcePropType }
                            style={ styles.wordmarkMark }
                            contentFit="contain"
                        />
                        <AppText variant="h2" style={ styles.wordmarkSans }>
                            Plastic
                            <AppText variant="h2" style={ styles.wordmarkSerif }> Brains</AppText>
                        </AppText>
                    </View>

                    <View style={ [onboardingStyles.card, styles.hero] }>
                        <AppText
                            variant="h1"
                            style={ [onboardingStyles.headline, compact && styles.compactHeadline] }
                            accessibilityRole="header"
                        >
                            { WELCOME_COPY.headline }
                        </AppText>

                        <AppText variant="body" style={ [onboardingStyles.body, styles.body] }>
                            { WELCOME_COPY.body }
                        </AppText>

                        <View style={ styles.illustrationWrapper }>
                            <Image
                                source={ brainIllustration }
                                style={ { width: illustrationSize, height: illustrationSize } }
                                contentFit="contain"
                                accessible
                                accessibilityLabel="An illustration of a brain being gently stretched"
                            />
                        </View>
                    </View>

                    { useCombinedScroll && footer }
                </ScrollView>
                { !useCombinedScroll && <View style={ styles.pinnedFooter }>{ footer }</View> }
            </SafeAreaView>
        </View>
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
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    wordmark: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 24,
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
    hero: {
        flexGrow: 1,
        padding: 24,
        borderRadius: 30,
    },
    compactHeadline: {
        fontSize: 28,
        lineHeight: 34,
    },
    body: {
        marginTop: 14,
    },
    illustrationWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        marginTop: 8,
    },
    pinnedFooter: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    footer: {
        paddingTop: 16,
        gap: 12,
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
