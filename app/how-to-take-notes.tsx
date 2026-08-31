import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';

type TemplateQuestion = {
    question: string;
    hint: string;
};

const QUESTIONS: TemplateQuestion[] = [
    {
        question: 'What stayed with me from today’s session?',
        hint: 'An idea, phrase, realisation or moment you do not want to lose.',
    },
    {
        question: 'What situation, thought or feeling do I want to notice this week?',
        hint: 'Something connected to what you discussed, if there is one.',
    },
    {
        question: 'What did I understand differently?',
        hint: 'Keep this in your own words.',
    },
    {
        question: 'Is there anything I want to try or remember?',
        hint: 'Leave this blank if nothing was agreed or suggested.',
    },
    {
        question: 'What do I want to return to in my next session?',
        hint: 'One subject is enough.',
    },
];

export default function HowToTakeNotesScreen() {
    const router = useRouter();
    const handleBack = () => router.back();
    const handleOpenRationale = () => router.push('/why-five-questions');

    return (
        <SafeAreaView style={ styles.container }>
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant="h1">5 Minute Post Therapy Template</AppText>

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="h2">Answer these 5 questions after your session</AppText>
                <Spacer variant={ SpacerVariant.small } />
                <AppText variant="body">
                    Write as much or as little as feels useful. This is your private note, not a record
                    you need to make perfect.
                </AppText>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.questionList }>
                    { QUESTIONS.map((item, index) => (
                        <View key={ item.question }>
                            <AppText variant="h3">
                                { index + 1 }. { item.question }
                            </AppText>
                            <Spacer variant={ SpacerVariant.small } />
                            <AppText variant="body">{ item.hint }</AppText>
                        </View>
                    )) }
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <Button
                    label="Why these five questions"
                    transparent
                    onPress={ handleOpenRationale }
                />
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
    questionList: { gap: 24 },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
});
