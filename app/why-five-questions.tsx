import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { ExternalLink } from 'src/components/ui/ExternalLink';

type RationaleSection = {
    question: string;
    paragraphs: string[];
};

const SECTIONS: RationaleSection[] = [
    {
        question: 'What stayed with you from today’s session?',
        paragraphs: [
            'The single best-evidenced way to keep something is to pull it back out of your head, not to read it again. A meta-analysis of 272 comparisons across 188 experiments found that people who practised recalling material later remembered substantially more than people who simply restudied it, and far more than people who did nothing extra.[3] Writing this line from memory, on a blank sheet, is that test. It is why the template gives you an empty line instead of a summary to tick.',
        ],
    },
    {
        question: 'What situation, thought or feeling do you want to notice this week?',
        paragraphs: [
            'What you do between sessions is not a supplement to therapy, it is a large part of what makes it work. Across 23 studies, how much between-session work people actually did predicted how well they came out of treatment, with a strong effect at the end of therapy (g = 0.79) across more than 1,500 people.[4] Naming one specific thing to watch for is the smallest version of that work.',
            'Naming the feeling earns its place separately. In a randomised experiment, spider-fearful people who put their fear into words during exposure showed a weaker physiological fear response a week later, facing a different spider in a different room, than people who reframed the fear, distracted themselves, or were simply exposed.[5] Putting it in words did more than trying to think about it differently.',
        ],
    },
    {
        question: 'What did you understand differently?',
        paragraphs: [
            'This line asks for your own words on purpose. A meta-analysis of 64 research reports found that prompting people to explain material to themselves, rather than restate it, produced a substantial improvement in what they learned, and it held across subjects, ages and task types.[6] A sentence you built yourself is also a better hook to find the idea by later than one you copied down.',
        ],
    },
    {
        question: 'Is there anything you want to try or remember?',
        paragraphs: [
            'Naming the situation and the response together, in the form “if this happens, I will do that”, is one of the most reliable findings in the psychology of follow-through. A meta-analysis of 94 independent tests found a medium-to-large effect on whether people actually did the thing they intended.[7] A general intention to do better does not carry that effect. The line stays optional: if nothing was agreed in the session, an invented plan is worse than a blank.',
        ],
    },
    {
        question: 'What do you want to return to in your next session?',
        paragraphs: [
            'Coming back to something across days beats going over it once, however hard. A synthesis of 839 comparisons drawn from 317 experiments found spaced review consistently outperformed massed review, and that the longer you need to hold on to something, the wider the gaps should be.[8] Choosing one subject now sets up the return, and means the next session opens on something rather than on a blank.',
        ],
    },
];

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
    const router = useRouter();
    const handleBack = () => router.back();

    return (
        <SafeAreaView style={ styles.container }>
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel="Back"
                    icon="back"
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
            </View>
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant="h1">Why these five questions</AppText>

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="body">
                    Most of a session does not survive the week. In studies of medical consultations, 40 to
                    80 per cent of what a practitioner says is forgotten immediately, and almost half of what
                    patients do remember, they remember wrongly.[1] This matters more in therapy than it
                    sounds: in cognitive therapy for depression, how much of the actual treatment content a
                    patient can recall predicts how closely they follow the work, whether they respond, and
                    whether the depression comes back.[2]
                </AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <AppText variant="body">
                    So an after-therapy note is not admin. Each of these five lines is doing a specific job,
                    and each one is built on a method with a large evidence base behind it.
                </AppText>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.sectionList }>
                    { SECTIONS.map((section) => (
                        <View key={ section.question }>
                            <AppText variant="h2">{ section.question }</AppText>
                            { section.paragraphs.map((paragraph) => (
                                <View key={ paragraph.slice(0, 40) }>
                                    <Spacer variant={ SpacerVariant.small } />
                                    <AppText variant="body">{ paragraph }</AppText>
                                </View>
                            )) }
                        </View>
                    )) }
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="body">
                    These are findings about methods, not promises about your therapy. What they support is
                    the shape of the sheet: recall rather than transcribe, name one thing to watch, use your
                    own words, pair a situation with a response, and come back to it.
                </AppText>

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="h2">References</AppText>
                <Spacer variant={ SpacerVariant.small } />
                <View style={ styles.referenceList }>
                    { REFERENCES.map((reference, index) => (
                        <View key={ reference.url } style={ styles.reference }>
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pageHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 8,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
    sectionList: { gap: 24 },
    referenceList: { gap: 12 },
    reference: { flexDirection: 'row', gap: 8 },
    referenceMarker: { width: 20, paddingTop: 6 },
    referenceLink: { flex: 1 },
});
