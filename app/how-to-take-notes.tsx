import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../src/components/GradientUpwards';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';
import { ExternalLink } from 'src/components/ui/ExternalLink';


export default function HowToTakeNotesScreen() {
    const router = useRouter();
    const handleBack = () => router.back();

    const sources = {
        recall: [
            {
                text: 'Dunlosky et al., 2013 — Effective learning techniques (review)',
                url: 'https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf',
            },
            {
                text: 'Roediger & Karpicke, 2006 — The power of testing (review)',
                url: 'https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf',
            },
        ],
        cues: [
            {
                text: 'Tulving & Thomson, 1973 — Encoding specificity',
                url: 'https://alicekim.ca/9.ESP73.pdf',
            },
        ],
        affectLabel: [
            {
                text: 'Lieberman et al., 2007 — Putting feelings into words (fMRI)',
                url: 'https://sanlab.psych.ucla.edu/wp-content/uploads/sites/31/2015/05/Lieberman_AL-2007.pdf',
            },
            {
                text: 'PubMed record',
                url: 'https://pubmed.ncbi.nlm.nih.gov/17576282/',
            },
        ],
        implIntent: [
            {
                text: 'Gollwitzer & Sheeran, 2006 — Implementation intentions (meta-analysis)',
                url: 'https://www.sciencedirect.com/science/article/pii/S0065260106380021',
            },
            {
                text: 'Overview PDF (NCI)',
                url: 'https://cancercontrol.cancer.gov/sites/default/files/2020-06/goal_intent_attain.pdf',
            },
        ],
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant="h1">How to get the most out of your notes</AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <AppText variant="body">
                    Make a short note right after therapy. Keep it practical so that when you re‑read later,
                    you know exactly what to do.
                </AppText>

                { /* TL;DR */ }
                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant="h2">TL;DR (under 30 seconds)</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">1) <AppText variant="body" style={ styles.bold }>What stood out</AppText> — 2 short lines.</AppText>
                    <AppText variant="body">2) <AppText variant="body" style={ styles.bold }>Where this shows up</AppText> — name a real situation or cue.</AppText>
                    <AppText variant="body">3) <AppText variant="body" style={ styles.bold }>What I feel</AppText> — 1 emotion + 1 body signal.</AppText>
                    <AppText variant="body">4) <AppText variant="body" style={ styles.bold }>If–then plan</AppText> — one sentence.</AppText>
                    <AppText variant="body">5) <AppText variant="body" style={ styles.bold }>Quick check for next time</AppText> — one question to answer when you re‑read.</AppText>
                </View>

                { /* Science section */ }
                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant="h2">Why these help (science + sources)</AppText>

                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="h2">1) What stood out</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">
                        Writing in your own words is <AppText variant="body" style={ styles.italic }>active recall</AppText>. It beats passive re‑reading and
                        makes the memory stronger for later review.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.recall.map((s) => (
                        <ExternalLink
                            key={ s.url }
                            text={ s.text }
                            url={ s.url }
                        />
                    )) }

                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="h2">2) Where this shows up</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">
                        Notes are more useful later when they mention the <AppText variant="body" style={ styles.italic }>same situation/cue</AppText>{ ' ' }
                        you’ll face (e.g., “during feedback with my manager”). Matching cues improve recall and use.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.cues.map((s) => (
                        <ExternalLink
                            key={ s.url }
                            text={ s.text }
                            url={ s.url }
                        />
                    )) }

                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="h2">3) What I feel</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">
                        Naming an emotion and a body signal is <AppText variant="body" style={ styles.italic }>affect labeling</AppText>. It helps the brain
                        down‑shift threat signals and engage control.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.affectLabel.map((s) => (
                        <ExternalLink
                            key={ s.url }
                            text={ s.text }
                            url={ s.url }
                        />
                    )) }

                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="h2">4) If–then plan</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">
                        “If [cue], then I will [action]” are <AppText variant="body" style={ styles.italic }>implementation intentions</AppText>. They increase
                        the chance you do the new response when it counts.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.implIntent.map((s) => (
                        <ExternalLink
                            key={ s.url }
                            text={ s.text }
                            url={ s.url }
                        />
                    )) }

                    <Spacer variant={ SpacerVariant.medium } />
                    <AppText variant="h2"> 5) Quick check for next time</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">
                        Ending with a simple question turns later re-reading into a tiny self‑test. Active checking is more effective than passive review.
                    </AppText>
                    { /* Re-use testing effect sources for brevity */ }
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.recall.map((s) => (
                        <ExternalLink
                            key={ `test-${s.url}` }
                            text={ s.text }
                            url={ s.url }
                        />
                    )) }
                </View>

                <Spacer variant={ SpacerVariant.large } />
            </ScrollView>

            <View style={ styles.footer }>
                <Button label="Back" onPress={ handleBack } transparent />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
    section: { gap: 8 },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    bold: { fontWeight: '600' },
    italic: { fontStyle: 'italic' },
});
