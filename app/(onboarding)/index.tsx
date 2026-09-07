import { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingLink } from '../../src/components/onboarding/OnboardingLink';
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
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from '../../src/components/ui/LinearGradientCircle';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { BRAND_FONTS } from 'designs/designs-typography';
import { PaperGrain } from '../../src/components/onboarding/PaperGrain';
import { shouldUseCombinedOnboardingScroll } from '../../src/components/onboarding/OnboardingScreen';

export default function WelcomeScreen() {
    const router = useRouter();
    const { height, fontScale } = useWindowDimensions();
    const useCombinedScroll = shouldUseCombinedOnboardingScroll(fontScale);
    const compact = height < 750;
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
                appearance="solid"
                label={ WELCOME_COPY.primaryCta }
                onPress={ () => router.push('/(onboarding)/goal') }
            />

            <OnboardingLink
                label={ WELCOME_COPY.secondaryCta }
                onPress={ () => router.push({
                    pathname: '/(auth)/login',
                    params: { source: WELCOME_AUTH_SOURCE },
                }) }
                style={ styles.secondaryAction }
            />
        </View>
    );

    const content = (
        <>
            <View style={ styles.heroLayer }>
            <View style={ [onboardingStyles.card, styles.hero] }>
                { /* Inside the glass, not above it. The mark belongs to the
                     card the sentence is on, rather than floating over the
                     page as a separate piece of furniture. */ }
                <View style={ styles.wordmark } accessible accessibilityRole="header" accessibilityLabel="Plastic Brains">
                    { /* A cut-out of the same mark, kept as a separate file on
                         purpose. brain-logo.png is also the app icon, and iOS
                         rejects an icon containing an alpha channel, so the
                         two cannot be the same asset. */ }
                    <Image
                        source={ require('../../assets/brain-logo-transparent.webp') as ImageSourcePropType }
                        style={ styles.wordmarkMark }
                        contentFit="contain"
                    />
                    <AppText variant="h2" style={ styles.wordmarkSans }>
                        Plastic
                        <AppText variant="h2" style={ styles.wordmarkSerif }> Brains</AppText>
                    </AppText>
                </View>

                { /* The sentence takes the room the mark leaves, and is
                     centred in it: the mark stays at the card's top corner
                     rather than riding down with the copy. */ }
                <View style={ styles.heroText }>
                    <AppText
                        variant="h1"
                        style={ [
                            onboardingStyles.headline,
                            styles.headline,
                            compact && styles.compactHeadline,
                        ] }
                        accessibilityRole="header"
                    >
                        { WELCOME_COPY.headline }
                    </AppText>
                </View>

            </View>
            </View>
        </>
    );

    return (
        <View style={ styles.safeArea }>
            <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_RIGHT } />

            { /* The same grain the rest of the flow is printed on, over the
                 glass rather than under it: the blur is what removes a texture
                 this fine. Everything else here stays as it was. */ }
            <PaperGrain />
            <SafeAreaView style={ styles.safeArea } edges={ ['top', 'left', 'right', 'bottom'] }>
                { /* Fixed, not scrolled. The screen is one image and two
                     sentences, sized to the display rather than allowed to run
                     past its bottom edge. Only the accessibility text sizes get
                     a scroll, where nothing can be made to fit and the actions
                     still have to stay reachable. */ }
                { useCombinedScroll ? (
                    <ScrollView
                        style={ styles.scroll }
                        contentContainerStyle={ styles.scrollContent }
                        showsVerticalScrollIndicator={ false }
                    >
                        { content }
                        { footer }
                    </ScrollView>
                ) : (
                    <>
                        <View style={ styles.fixedContent }>{ content }</View>
                        <View style={ styles.pinnedFooter }>{ footer }</View>
                    </>
                ) }
            </SafeAreaView>
        </View>
    );
}

/** The screen's gutter, and the hero card's own padding inside it. */
const SCREEN_PADDING = 24;
const HERO_PADDING = 24;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 16,
        paddingBottom: 20,
    },
    fixedContent: {
        flex: 1,
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 16,
        paddingBottom: 20,
    },
    wordmark: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 20,
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
    heroLayer: {
        flex: 1,
    },
    hero: {
        flex: 1,
        padding: HERO_PADDING,
        borderRadius: 30,
    },
    heroText: {
        // The card is as tall as the screen leaves it and its sentence is not.
        // Centred in what the wordmark leaves, the words sit in the card rather
        // than at the top of it with a hole underneath.
        flex: 1,
        justifyContent: 'center',
    },
    /**
     * Larger than the headline on the rest of the flow. This is the one screen
     * whose whole job is the sentence on it: everywhere after it the headline
     * labels content sitting underneath, and here it is the content.
     */
    /**
     * GeneralSans at its book weight, not the flow's headline face: set this
     * large it reads as the brand's own display lettering rather than as a
     * heading over something.
     */
    headline: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        fontSize: 40,
        lineHeight: 47,
        letterSpacing: -0.6,
    },
    /** The same step up, on a screen too short to give it the full size. */
    compactHeadline: {
        fontSize: 33,
        lineHeight: 40,
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
        alignSelf: 'center',
    },
});
