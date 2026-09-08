import React, { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ACCENT_SURFACE,
    BRAND_ORANGE,
    COLOR_VARIANTS,
    SURFACE_ACCENT,
    SURFACE_BLUE,
} from 'designs/designs-colors';
import AppText from '../ui/AppText';
import { OnboardingProgress } from './OnboardingProgress';
import { BackButton } from '../ui/BackButton';
import { GlassMorphismWithCircle } from '../ui/GlassMorphismWithCircle';
import { PaperGrain } from './PaperGrain';
import { onboardingAccentStyles, onboardingStyles } from './onboardingStyles';
import { OnboardingStepAnalytics } from '../../features/onboarding/OnboardingStepAnalytics';
import type { OnboardingStep } from '../../features/analytics/events';

type BaseProps = {
    /** Static analytics label, supplied only by a step's visible UI branch. */
    analyticsStep?: OnboardingStep;
    /** 1-4 for the personalisation questions; omitted elsewhere. */
    step?: number;
    headline: string;
    supporting?: string;
    children?: React.ReactNode;
    /** Centre a short loading state within the space above the actions. */
    centeredBody?: boolean;
    /** Buttons and links. Pinned normally, then placed in-flow at accessibility text sizes. */
    footer: React.ReactNode;
    /**
     * A background image for the lower part of the screen. Purely decorative
     * and purely behind: it changes nothing about the layout, the scroll or
     * the footer, which sit exactly where they would without it. At
     * accessibility text sizes it moves into the flow at the end of the
     * combined scroll so it can never sit behind the actions.
     *
     * Given as a function, it is handed the screen coordinate where the body
     * content ends, so the artwork can sit directly under the last card
     * whatever its height. Set as a fraction of the screen instead, it lined up
     * only on the display it was tuned on: the cards are sized by their text,
     * so on a taller phone they finish in the same place while a percentage
     * puts the artwork much further down. In the combined scroll the backdrop
     * is in the flow and the value is 0.
     */
    bottomBackdrop?: React.ReactNode | ((contentBottom: number) => React.ReactNode);
    /**
     * The ground the screen sits on.
     *
     * `light` is the app's pale blue with its sheet of glass over it, and is
     * what every question and review screen uses. `accent` swaps in the brand
     * orange and the white ink that goes with it, for a screen whose subject is
     * an image of the app rather than the page's own content: on the pale
     * ground a screenshot of a pale app reads as a second page, and on the
     * accent it reads as a screen. The glass is dropped there, having nothing
     * behind it left to blur.
     */
    surface?: OnboardingSurface;
    /**
     * How the supporting line is set.
     *
     * `plain` is a paragraph under the headline. `banner` puts it in a band of
     * the brand orange running the full width of the display, edge to edge and
     * unrounded, for a line that is the answer the screen exists to give rather
     * than a note about the content below it.
     */
    supportingAppearance?: 'plain' | 'banner';
};

export type OnboardingSurface = 'light' | 'accent';

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
 * The gutter the scroll and the footer are set in.
 *
 * Exported for content that runs out through the gutter to the display's
 * edges, the way the supporting banner does, and has to know how far to go.
 */
export const ONBOARDING_SCREEN_PADDING = 24;
const SCREEN_PADDING = ONBOARDING_SCREEN_PADDING;

const BODY_TOP_FADE = 16;
const BODY_BOTTOM_FADE = 48;
const BUTTON_SHADOW_SPACE = 48;

/**
 * The shell every onboarding screen sits in.
 *
 * At standard text sizes, content scrolls above a pinned action area. At the
 * accessibility text sizes, body and actions share one continuous scroll so a
 * tall footer cannot squeeze the body or leave part of the purchase action
 * unreachable.
 */
export function OnboardingScreen({
    analyticsStep,
    step,
    headline,
    supporting,
    supportingAppearance = 'plain',
    children,
    centeredBody = false,
    footer,
    bottomBackdrop,
    surface = 'light',
    showBack = true,
    backHref,
}: Props) {
    const isAccent = surface === 'accent';
    // Where the body's last card ends, in the backdrop's own coordinates.
    //
    // Composed from two layout events rather than read with measureInWindow.
    // Both are synchronous and in one chain: the scroll's y is relative to the
    // screen, and the content's y is relative to the scroll's content. The
    // asynchronous measure raced the layout it was measuring, so changing an
    // answer left the artwork placed against the previous card's height and
    // overlapping the new one.
    const [scrollTop, setScrollTop] = useState(0);
    const [contentBox, setContentBox] = useState({ y: 0, height: 0 });
    const contentBottom = contentBox.height === 0
        ? 0
        : scrollTop + contentBox.y + contentBox.height;
    const insets = useSafeAreaInsets();
    const { fontScale } = useWindowDimensions();
    const useCombinedScroll = shouldUseCombinedOnboardingScroll(fontScale);
    const [footerContentHeight, setFooterContentHeight] = useState(0);
    const [footerViewportHeight, setFooterViewportHeight] = useState(0);
    const [bodyContentHeight, setBodyContentHeight] = useState(0);
    const [bodyViewportHeight, setBodyViewportHeight] = useState(0);
    // A short preview stays still; smaller screens and larger text can still
    // scroll once the actual content needs more room than its viewport.
    const bodyOverflows = bodyContentHeight > bodyViewportHeight + 1;
    // A fitted footer needs no clipping: its glass-button shadow must be able
    // to fade into the bottom safe area. Keep clipping for an overflowing
    // footer so scrolling actions cannot paint over the body or home indicator.
    const footerOverflows = footerContentHeight > footerViewportHeight + 1;

    // The four personalisation questions keep the large headline over the body:
    // each one is a question being asked, and it should read like one. The
    // screens after them are review and preview screens whose title is a label
    // for what is already on screen, so it sits beside the back arrow instead
    // and gives the content the vertical space.
    const titleBesideBack = step === undefined && showBack && !useCombinedScroll;

    const body = (
        <>
            { !titleBesideBack && (
                <AppText
                    variant="h1"
                    style={ [onboardingStyles.headline, isAccent && onboardingAccentStyles.headline] }
                    accessibilityRole="header"
                >
                    { headline }
                </AppText>
            ) }

            { supporting !== undefined && supportingAppearance === 'plain' && (
                <AppText variant="body" style={ [onboardingStyles.body, !titleBesideBack && styles.supporting, isAccent && onboardingAccentStyles.body] }>
                    { supporting }
                </AppText>
            ) }

            { /* Out through the scroll's own gutter so the band reaches both
                 edges of the display. */ }
            { supporting !== undefined && supportingAppearance === 'banner' && (
                <View style={ [styles.supportingBanner, !titleBesideBack && styles.supporting] }>
                    <AppText variant="body" style={ [onboardingStyles.body, styles.supportingBannerText] }>
                        { supporting }
                    </AppText>
                </View>
            ) }

            { /* collapsable={false} keeps the view in the native tree on
                 Android, where a plain wrapper with no style of its own is
                 flattened away and reports no layout. */ }
            <View
                collapsable={ false }
                onLayout={ (event) => setContentBox({
                    y: event.nativeEvent.layout.y,
                    height: event.nativeEvent.layout.height,
                }) }
            >
                { children }
            </View>
        </>
    );

    const backdrop = (atFlow: boolean): React.ReactNode =>
        typeof bottomBackdrop === 'function'
            ? bottomBackdrop(atFlow ? 0 : contentBottom)
            : bottomBackdrop;

    const bodyMask = (
        <View style={ styles.scroll } pointerEvents="none">
            <LinearGradient
                colors={ [COLOR_VARIANTS.transparent, COLOR_VARIANTS.black.primary] }
                style={ [styles.topFade, titleBesideBack && styles.compactTopFade] }
            />
            <View style={ styles.solidMask } />
            <LinearGradient
                colors={ [COLOR_VARIANTS.black.primary, COLOR_VARIANTS.transparent] }
                style={ styles.bottomFade }
            />
        </View>
    );

    return (
        <View style={ [styles.safeArea, isAccent && styles.accentSurface] }>
            { analyticsStep !== undefined && <OnboardingStepAnalytics step={ analyticsStep } /> }
            { /* Glass only. The gradient circle is Welcome's alone: repeating it
                 behind every step made the artwork read as chrome rather than
                 as the opening image. */ }
            { !isAccent && <GlassMorphismWithCircle /> }

            { /* The pale screens are printed on grain; the accent one is a
                 flat block of colour and stays flat. Over the glass, not under
                 it: the glass blurs whatever is behind it, and a blur is
                 exactly what removes a texture this fine. */ }
            { !isAccent && <PaperGrain /> }

            <SafeAreaView style={ styles.safeArea } edges={ ['top', 'left', 'right', 'bottom'] }>
                <View style={ styles.header }>
                    { /* The same glass and the same ink on every screen, the
                         accent ground included: the control the whole flow is
                         navigated by should not change appearance partway
                         through it. The glass is near-clear and takes the
                         colour of whatever is behind it, so on the accent it
                         needs the app's pale surface put back behind it. */ }
                    { showBack && (
                        <View style={ isAccent ? styles.backOnAccent : undefined }>
                            <BackButton fallbackHref={ backHref } appearance="glass" />
                        </View>
                    ) }

                    { titleBesideBack && (
                        <AppText
                            testID="onboarding-header-title"
                            variant="h3"
                            style={ [styles.headerTitle, isAccent && onboardingAccentStyles.headline] }
                            accessibilityRole="header"
                        >
                            { headline }
                        </AppText>
                    ) }

                    { /* Beside the arrow, not under it. The questions have no
                         title in this row, so the bar has the width, and the
                         two controls that say where you are in the flow sit on
                         one line instead of two. */ }
                    { step !== undefined && <OnboardingProgress step={ step } inline /> }
                </View>

                { useCombinedScroll ? (
                    <MaskedView style={ styles.scroll } maskElement={ bodyMask }>
                        <ScrollView
                            testID="onboarding-combined-scroll"
                            style={ styles.scroll }
                            contentContainerStyle={ [centeredBody && styles.centeredScrollContent, styles.combinedScrollContent] }
                            showsVerticalScrollIndicator={ false }
                            alwaysBounceVertical={ false }
                            keyboardShouldPersistTaps="handled"
                        >
                            { body }

                            <View testID="onboarding-footer" style={ styles.combinedFooter }>
                                { footer }
                            </View>

                            { bottomBackdrop !== undefined && (
                                <View testID="onboarding-backdrop" style={ styles.combinedBackdrop }>
                                    { backdrop(true) }
                                </View>
                            ) }
                        </ScrollView>
                    </MaskedView>
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
                                { backdrop(false) }
                            </View>
                        ) }

                        <MaskedView
                            style={ styles.scroll }
                            onLayout={ (event) => setScrollTop(event.nativeEvent.layout.y) }
                            maskElement={ bodyMask }
                        >
                            <ScrollView
                                testID="onboarding-body-scroll"
                                style={ styles.scroll }
                                contentContainerStyle={ [styles.scrollContent, titleBesideBack && styles.compactScrollContent, centeredBody && styles.centeredScrollContent] }
                                onContentSizeChange={ (_width, height) => setBodyContentHeight(height) }
                                onLayout={ (event) => setBodyViewportHeight(event.nativeEvent.layout.height) }
                                scrollEnabled={ bodyOverflows }
                                alwaysBounceVertical={ false }
                                showsVerticalScrollIndicator={ false }
                                keyboardShouldPersistTaps="handled"
                            >
                                { body }
                            </ScrollView>
                        </MaskedView>

                        <ScrollView
                            testID="onboarding-footer"
                            style={ [styles.footer, { overflow: footerOverflows ? 'hidden' : 'visible' }] }
                            contentContainerStyle={ styles.footerContent }
                            onContentSizeChange={ (_width, height) => setFooterContentHeight(height) }
                            onLayout={ (event) => setFooterViewportHeight(event.nativeEvent.layout.height) }
                            removeClippedSubviews={ false }
                            scrollEnabled={ footerOverflows }
                            showsVerticalScrollIndicator={ false }
                            alwaysBounceVertical={ false }
                        >
                            { footer }
                        </ScrollView>
                    </>
                ) }
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    accentSurface: {
        backgroundColor: SURFACE_ACCENT,
    },
    // Sized by the button it holds, so the disc cannot drift from the glass.
    backOnAccent: {
        borderRadius: 24,
        backgroundColor: SURFACE_BLUE,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        lineHeight: 24,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    scroll: {
        flex: 1,
    },
    solidMask: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.black.primary,
    },
    topFade: {
        height: BODY_TOP_FADE,
    },
    compactTopFade: {
        height: 8,
    },
    bottomFade: {
        height: BODY_BOTTOM_FADE,
    },
    // Clear the back arrow and the top fade before the first line of content.
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        // At the end of the list the last card must clear the fade completely.
        paddingBottom: BODY_BOTTOM_FADE + 24,
    },
    // A title in the header needs one small gutter below it, without the
    // additional space that separates a question headline from its body.
    compactScrollContent: {
        paddingTop: 12,
    },
    combinedScrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        // This footer is inside a clipping scroll view, so reserve the shadow's
        // space in its content instead of letting it end at the button's edge.
        paddingBottom: BUTTON_SHADOW_SPACE,
    },
    centeredScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 20,
    },
    supporting: {
        marginTop: 14,
    },
    supportingBanner: {
        marginHorizontal: -SCREEN_PADDING,
        paddingHorizontal: SCREEN_PADDING,
        paddingVertical: 18,
        backgroundColor: BRAND_ORANGE,
    },
    supportingBannerText: {
        color: ACCENT_SURFACE.textPrimary,
    },
    footer: {
        flexGrow: 0,
        flexShrink: 0,
        maxHeight: '45%',
    },
    footerContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
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
