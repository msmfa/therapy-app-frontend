/**
 * The write-up is translated; the reference list below is not. See
 * src/i18n/englishOnly.ts: a citation identifies a specific published paper.
 */
import React, { useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../src/context/theme';
import { ExternalLink } from 'src/components/ui/ExternalLink';
import { CitedText } from 'src/components/ui/CitedText';
import { useTranslation } from 'react-i18next';
import { t as translate } from '../src/i18n/translate';


type RationaleSection = {
    question: string;
    paragraphs: string[];
};

const SECTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

/**
 * Built per call rather than held as a constant, so the page follows a change
 * of language. The bracketed markers index into REFERENCES below and are
 * asserted to match the English in the resource-parity test: a marker dropped
 * in translation would point at the wrong paper.
 *
 * The opening paragraph was a module-level `const` for exactly as long as it
 * took someone to notice: it resolved once, at import, so the page's first
 * paragraph stayed in whatever language was active then while everything
 * below it followed the setting. It is read from `tScience` in the component
 * now, like the rest.
 */
const sections = (): RationaleSection[] =>
    SECTION_KEYS.map((key) => ({
        question: translate(`science:fiveQuestions.${key}.question`),
        paragraphs: translate(`science:fiveQuestions.${key}.paragraphs`, {
            returnObjects: true,
        }) as string[],
    }));


type Reference = {
    text: string;
    url: string;
};

// Links prefer free full text on PubMed Central where it exists, and fall back
// to the publisher's DOI, which is the stable identifier for the article.
const REFERENCES: Reference[] = [
    {
        text: 'Kessels (2003), Patients’ memory for medical information. Journal of the Royal Society of Medicine.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC539473/',
    },
    {
        text: 'Dong, Zhao, Ong & Harvey (2017), Patient recall of specific cognitive therapy contents predicts adherence and outcome in adults with major depressive disorder. Behaviour Research and Therapy.',
        url: 'https://doi.org/10.1016/j.brat.2017.08.006',
    },
    {
        text: 'Adesope, Trevisan & Sundararajan (2017), Rethinking the use of tests: A meta-analysis of practice testing. Review of Educational Research. Practice testing beat restudying, g = 0.51, and beat no extra activity, g = 0.93.',
        url: 'https://doi.org/10.3102/0034654316689306',
    },
    {
        text: 'Kazantzis, Whittington, Zelencich, Kyrios, Norton & Hofmann (2016), Quantity and quality of homework compliance: A meta-analysis of relations with outcome in cognitive behavior therapy. Behavior Therapy. Homework quantity and outcome at post-treatment, g = 0.79 across 15 comparisons and 1,537 people.',
        url: 'https://doi.org/10.1016/j.beth.2016.05.002',
    },
    {
        text: 'Kircanski, Lieberman & Craske (2012), Feelings into words: Contributions of language to exposure therapy. Psychological Science.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4721564/',
    },
    {
        text: 'Bisra, Liu, Nesbit, Salimi & Winne (2018), Inducing self-explanation: A meta-analysis. Educational Psychology Review. 69 effect sizes from 64 studies, g = 0.55.',
        url: 'https://doi.org/10.1007/s10648-018-9434-x',
    },
    {
        text: 'Gollwitzer & Sheeran (2006), Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology. 94 independent tests, d = 0.65.',
        url: 'https://doi.org/10.1016/S0065-2601(06)38002-1',
    },
    {
        text: 'Cepeda, Pashler, Vul, Wixted & Rohrer (2006), Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin.',
        url: 'https://doi.org/10.1037/0033-2909.132.3.354',
    },
];

export default function WhyFiveQuestionsScreen() {
    const { t } = useTranslation('common');
    const { t: tScience } = useTranslation('science');
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const scrollRef = useRef<ScrollView>(null);
    const referencesTop = useRef<number | null>(null);
    const referenceOffsets = useRef<Record<number, number>>({});
    const pendingReference = useRef<number | null>(null);
    const [selectedReference, setSelectedReference] = useState<number | null>(null);
    const handleBack = () => router.back();

    const scrollToReference = (position: number) => {
        const rowTop = referenceOffsets.current[position];

        if (referencesTop.current === null || rowTop === undefined || scrollRef.current === null) {
            pendingReference.current = position;
            return;
        }

        pendingReference.current = null;
        scrollRef.current.scrollTo({
            y: Math.max(0, referencesTop.current + rowTop - TOP_FADE_HEIGHT - 8),
            animated: true,
        });
    };

    const handleCitationPress = (position: number) => {
        const reference = REFERENCES[position - 1];
        if (!reference) return;

        setSelectedReference(position);
        scrollToReference(position);
        AccessibilityInfo.announceForAccessibility(`Source ${position}: ${reference.text}`);
    };

    return (
        <SafeAreaView edges={ ['top', 'left', 'right'] } style={ styles.container }>
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel={ t('action.back') }
                    icon="back"
                    iconColor={ theme.ink.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
                <AppText variant="h1" accessibilityRole="header" style={ styles.pageTitle }>{ tScience('fiveQuestions.title') }</AppText>
            </View>
            <MaskedView
                style={ styles.scroll }
                maskElement={
                    <View style={ styles.scroll } pointerEvents="none">
                        <LinearGradient
                            colors={ [COLOR_VARIANTS.transparent, COLOR_VARIANTS.black.primary] }
                            style={ styles.topFade }
                        />
                        <View style={ styles.solidMask } />
                    </View>
                }
            >
                <ScrollView
                    ref={ scrollRef }
                    style={ styles.scroll }
                    contentContainerStyle={ [styles.scrollContent, { paddingBottom: insets.bottom + 24 }] }
                    contentInsetAdjustmentBehavior="never"
                    showsVerticalScrollIndicator={ false }
                >
                    <View style={ styles.summaryBanner }>
                        { /* At night the band is the panel charcoal and its
                             emphasis is a lit rule along the top; by day the
                             orange fill carries it and there is no rule. */ }
                        { theme.emphasis.rule !== null && (
                            <LinearGradient
                                colors={ theme.emphasis.rule }
                                start={ { x: 0, y: 0 } }
                                end={ { x: 1, y: 0 } }
                                style={ styles.emphasisRule }
                            />
                        ) }
                        <AppText variant="h2" accessibilityRole="header" style={ styles.summaryText }>{ tScience('tldr') }</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant="body" style={ styles.summaryText }>{ tScience('fiveQuestions.intro') }</AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <CitedText
                        text={ tScience('fiveQuestions.opening') }
                        sources={ REFERENCES }
                        onCitationPress={ handleCitationPress }
                    />
                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="body">{ tScience('fiveQuestions.lead') }</AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.sectionList }>
                        { sections().map((section, index) => (
                            <View key={ section.question }>
                                <AppText variant="h2" accessibilityRole="header">
                                    { `${index + 1}. ${section.question}` }
                                </AppText>
                                { section.paragraphs.map((paragraph) => (
                                    <View key={ paragraph.slice(0, 40) }>
                                        <Spacer variant={ SpacerVariant.small } />
                                        <CitedText text={ paragraph } sources={ REFERENCES } onCitationPress={ handleCitationPress } />
                                    </View>
                                )) }
                            </View>
                        )) }
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant="body">{ tScience('fiveQuestions.outro') }</AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant="h2">{ tScience('references') }</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <View
                        testID="rationale-references"
                        style={ styles.referenceList }
                        onLayout={ (event) => {
                            referencesTop.current = event.nativeEvent.layout.y;
                            if (pendingReference.current !== null) scrollToReference(pendingReference.current);
                        } }
                    >
                        { REFERENCES.map((reference, index) => (
                            <View
                                key={ reference.url }
                                testID={ `rationale-reference-${index + 1}` }
                                style={ [styles.reference, selectedReference === index + 1 && styles.referenceSelected] }
                                onLayout={ (event) => {
                                    referenceOffsets.current[index + 1] = event.nativeEvent.layout.y;
                                    if (pendingReference.current !== null) scrollToReference(pendingReference.current);
                                } }
                            >
                                <AppText variant="caption" style={ styles.referenceMarker }>
                                    { index + 1 }.
                                </AppText>
                                <ExternalLink
                                    variant="caption"
                                    text={ reference.text }
                                    url={ reference.url }
                                    containerStyle={ styles.referenceLink }
                                />
                            </View>
                        )) }
                    </View>
                </ScrollView>
            </MaskedView>

        </SafeAreaView>
    );
}

const PAGE_PADDING = 24;
const TOP_FADE_HEIGHT = 16;

const makeStyles = (theme: Theme) => StyleSheet.create({
    pageHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 16,
        paddingBottom: 8,
        paddingHorizontal: PAGE_PADDING,
        paddingTop: 8,
    },
    pageTitle: { flex: 1 },
    container: { flex: 1 },
    scroll: { flex: 1 },
    topFade: { height: TOP_FADE_HEIGHT },
    solidMask: { flex: 1, backgroundColor: COLOR_VARIANTS.black.primary },
    // Keep the home-indicator clearance inside the scrollable content so the
    // viewport reaches the screen edge instead of leaving a fixed blank strip.
    scrollContent: { paddingHorizontal: PAGE_PADDING, paddingTop: TOP_FADE_HEIGHT },
    summaryBanner: {
        marginHorizontal: -PAGE_PADDING,
        paddingHorizontal: PAGE_PADDING,
        paddingVertical: 24,
        backgroundColor: theme.emphasis.panel,
    },
    emphasisRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
    summaryText: { color: theme.emphasis.ink },
    sectionList: { gap: 24 },
    referenceList: { gap: 12 },
    reference: { flexDirection: 'row', gap: 8, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
    referenceSelected: { backgroundColor: theme.accent.markSurface },
    referenceMarker: { width: 20, paddingTop: 6 },
    referenceLink: { flex: 1 },
});
