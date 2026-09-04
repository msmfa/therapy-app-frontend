import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import { OnboardingProgress } from './OnboardingProgress';
import { BackButton } from '../ui/BackButton';

type BaseProps = {
    /** 1-4 for the personalisation questions; omitted elsewhere. */
    step?: number;
    headline: string;
    supporting?: string;
    children?: React.ReactNode;
    /** Buttons and links. Pinned normally, then placed in-flow at accessibility text sizes. */
    footer: React.ReactNode;
    /**
     * A background image for the lower part of the screen. Purely decorative
     * and purely behind: it changes nothing about the layout, the scroll or
     * the footer, which sit exactly where they would without it. At
     * accessibility text sizes it moves into the flow at the end of the
     * combined scroll so it can never sit behind the actions.
     */
    bottomBackdrop?: React.ReactNode;
};

/**
 * Back navigation is an explicit screen contract.
 *
 * Requiring a fallback whenever Back is shown means a resumed, redirected or
 * deep-linked screen cannot silently lose the control when stack history is
 * empty. Post-purchase screens must explicitly opt out instead of inheriting a
 * back button that leads into a purchase loop.
 */
type NavigationProps =
    | {
        showBack: false;
        backHref?: never;
    }
    | {
        showBack?: true;
        /** Logical previous route when this screen was opened without stack history. */
        backHref: Href;
    };

type Props = BaseProps & NavigationProps;

/** The first iOS accessibility text category starts above the standard 1.35 scale. */
export const shouldUseCombinedOnboardingScroll = (fontScale: number): boolean => fontScale >= 1.5;

/**
 * The shell every onboarding screen sits in.
 *
 * At standard text sizes, content scrolls above a pinned action area. At the
 * accessibility text sizes, body and actions share one continuous scroll so a
 * tall footer cannot squeeze the body or leave part of the purchase action
 * unreachable.
 */
export function OnboardingScreen({
    step,
    headline,
    supporting,
    children,
    footer,
    bottomBackdrop,
    showBack = true,
    backHref,
}: Props) {
    const insets = useSafeAreaInsets();
    const { fontScale } = useWindowDimensions();
    const useCombinedScroll = shouldUseCombinedOnboardingScroll(fontScale);

    // The four personalisation questions keep the large headline over the body:
    // each one is a question being asked, and it should read like one. The
    // screens after them are review and preview screens whose title is a label
    // for what is already on screen, so it sits beside the back arrow instead
    // and gives the content the vertical space.
    const titleBesideBack = step === undefined && showBack;

    const body = (
        <>
            { !titleBesideBack && (
                <AppText
                    variant="h1"
                    style={ styles.headline }
                    accessibilityRole="header"
                >
                    { headline }
                </AppText>
            ) }

            { supporting !== undefined && (
                <AppText variant="body" style={ styles.supporting }>
                    { supporting }
                </AppText>
            ) }

            { children }
        </>
    );

    return (
        <SafeAreaView style={ styles.safeArea } edges={ ['top', 'left', 'right', 'bottom'] }>
            <View style={ styles.header }>
                { showBack && <BackButton fallbackHref={ backHref } /> }

                { titleBesideBack && (
                    <AppText
                        testID="onboarding-header-title"
                        variant="h3"
                        style={ styles.headerTitle }
                        accessibilityRole="header"
                        numberOfLines={ 1 }
                    >
                        { headline }
                    </AppText>
                ) }
            </View>

            { step !== undefined && <OnboardingProgress step={ step } /> }

            { useCombinedScroll ? (
                <ScrollView
                    testID="onboarding-combined-scroll"
                    style={ styles.scroll }
                    contentContainerStyle={ styles.combinedScrollContent }
                    showsVerticalScrollIndicator={ false }
                    keyboardShouldPersistTaps="handled"
                >
                    { body }

                    <View testID="onboarding-footer" style={ styles.combinedFooter }>
                        { footer }
                    </View>

                    { bottomBackdrop !== undefined && (
                        <View testID="onboarding-backdrop" style={ styles.combinedBackdrop }>
                            { bottomBackdrop }
                        </View>
                    ) }
                </ScrollView>
            ) : (
                <>
                    { bottomBackdrop !== undefined && (
                        // First in source order so everything else stacks
                        // above it; shifted past the safe-area padding so the
                        // artwork sits against the physical bottom edge.
                        <View
                            testID="onboarding-backdrop"
                            pointerEvents="none"
                            style={ [styles.backdrop, { bottom: -insets.bottom }] }
                        >
                            { bottomBackdrop }
                        </View>
                    ) }

                    <ScrollView
                        style={ styles.scroll }
                        contentContainerStyle={ styles.scrollContent }
                        showsVerticalScrollIndicator={ false }
                        keyboardShouldPersistTaps="handled"
                    >
                        { body }
                    </ScrollView>

                    <ScrollView
                        testID="onboarding-footer"
                        style={ styles.footer }
                        contentContainerStyle={ styles.footerContent }
                        showsVerticalScrollIndicator={ false }
                        alwaysBounceVertical={ false }
                    >
                        { footer }
                    </ScrollView>
                </>
            ) }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    combinedScrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headline: {
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: -0.4,
    },
    supporting: {
        marginTop: 10,
        fontSize: 17,
        lineHeight: 25,
    },
    footer: {
        flexGrow: 0,
        flexShrink: 0,
        maxHeight: '45%',
    },
    footerContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 12,
    },
    combinedFooter: {
        paddingTop: 24,
        gap: 12,
    },
    backdrop: {
        // A full-screen background sheet: the artwork inside positions itself
        // with a top margin, shows its rounded top, and bleeds past the
        // bottom, where the screen edge clips it.
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        alignItems: 'center',
    },
    combinedBackdrop: {
        marginTop: 24,
    },
});
