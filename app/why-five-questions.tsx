import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';

type RationaleSection = {
    question: string;
    paragraphs: string[];
};

const SECTIONS: RationaleSection[] = [
    {
        question: 'What stayed with me from today’s session?',
        paragraphs: [
            'The single best-evidenced way to keep something is to pull it back out of your head, not to read it again. A meta-analysis of 272 comparisons across 188 experiments found that people who practised recalling material later remembered substantially more than people who simply restudied it, and far more than people who did nothing extra.[3] Writing this line from memory, on a blank sheet, is that test. It is why the template gives you an empty line instead of a summary to tick.',
        ],
    },
    {
        question: 'What situation, thought or feeling do I want to notice this week?',
        paragraphs: [
            'What you do between sessions is not a supplement to therapy, it is a large part of what makes it work. Across 23 studies, how much between-session work people actually did predicted how well they came out of treatment, with a strong effect at the end of therapy (g = 0.79) across more than 1,500 people.[4] Naming one specific thing to watch for is the smallest version of that work.',
            'Naming the feeling earns its place separately. In a randomised experiment, spider-fearful people who put their fear into words during exposure showed a weaker physiological fear response a week later, facing a different spider in a different room, than people who reframed the fear, distracted themselves, or were simply exposed.[5] Putting it in words did more than trying to think about it differently.',
        ],
    },
    {
        question: 'What did I understand differently?',
        paragraphs: [
            'This line asks for your own words on purpose. A meta-analysis of 64 research reports found that prompting people to explain material to themselves, rather than restate it, produced a substantial improvement in what they learned, and it held across subjects, ages and task types.[6] A sentence you built yourself is also a better hook to find the idea by later than one you copied down.',
        ],
    },
    {
        question: 'Is there anything I want to try or remember?',
        paragraphs: [
            'Naming the situation and the response together, in the form “if this happens, I will do that”, is one of the most reliable findings in the psychology of follow-through. A meta-analysis of 94 independent tests found a medium-to-large effect on whether people actually did the thing they intended.[7] A general intention to do better does not carry that effect. The line stays optional: if nothing was agreed in the session, an invented plan is worse than a blank.',
        ],
    },
    {
        question: 'What do I want to return to in my next session?',
        paragraphs: [
            'Coming back to something across days beats going over it once, however hard. A synthesis of 839 comparisons drawn from 317 experiments found spaced review consistently outperformed massed review, and that the longer you need to hold on to something, the wider the gaps should be.[8] Choosing one subject now sets up the return, and means the next session opens on something rather than on a blank.',
        ],
    },
];

const REFERENCES: string[] = [
    'Kessels (2003), Patients’ memory for medical information. Journal of the Royal Society of Medicine.',
    'Dong, Zhao, Ong & Harvey (2017), Patient recall of specific cognitive therapy contents predicts adherence and outcome in adults with major depressive disorder. Behaviour Research and Therapy.',
    'Adesope, Trevisan & Sundararajan (2017), Rethinking the use of tests: A meta-analysis of practice testing. Review of Educational Research. Practice testing beat restudying, g = 0.51, and beat no extra activity, g = 0.93.',
    'Kazantzis, Whittington, Zelencich, Kyrios, Norton & Hofmann (2016), Quantity and quality of homework compliance: A meta-analysis of relations with outcome in cognitive behavior therapy. Behavior Therapy. Homework quantity and outcome at post-treatment, g = 0.79 across 15 comparisons and 1,537 people.',
    'Kircanski, Lieberman & Craske (2012), Feelings into words: Contributions of language to exposure therapy. Psychological Science.',
    'Bisra, Liu, Nesbit, Salimi & Winne (2018), Inducing self-explanation: A meta-analysis. Educational Psychology Review. 69 effect sizes from 64 studies, g = 0.55.',
    'Gollwitzer & Sheeran (2006), Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology. 94 independent tests, d = 0.65.',
    'Cepeda, Pashler, Vul, Wixted & Rohrer (2006), Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin.',
];

export default function WhyFiveQuestionsScreen() {
    const router = useRouter();
    const handleBack = () => router.back();
    const handleOpenIntervalScience = () => router.push('/interval-science');

    return (
        <SafeAreaView style={ styles.container }>
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
                    own words, pair a situation with a response, and come back to it. There is more on how
                    therapy changes patterns in the brain, and on the intervals the app uses, on the science
                    behind therapy and research-based intervals.
                </AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <Button
                    label="The science behind our reminder intervals"
                    transparent
                    onPress={ handleOpenIntervalScience }
                />

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="h2">References</AppText>
                <Spacer variant={ SpacerVariant.small } />
                <View style={ styles.referenceList }>
                    { REFERENCES.map((reference, index) => (
                        <View key={ reference.slice(0, 40) } style={ styles.reference }>
                            <AppText variant="caption" style={ styles.referenceMarker }>
                                { index + 1 }.
                            </AppText>
                            <AppText variant="caption" style={ styles.referenceText }>
                                { reference }
                            </AppText>
                        </View>
                    )) }
                </View>
            </ScrollView>

            <View style={ styles.footer }>
                <Button label="Back" onPress={ handleBack } />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
    sectionList: { gap: 24 },
    referenceList: { gap: 12 },
    reference: { flexDirection: 'row', gap: 8 },
    referenceMarker: { width: 20 },
    referenceText: { flex: 1 },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
});
