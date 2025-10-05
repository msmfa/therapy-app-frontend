import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../src/components/GradientUpwards';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';

export default function HowToTakeNotesScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant='h1'>
                    How to get the most out of your notes
                </AppText>
                <Spacer variant={ SpacerVariant.medium } />

                <AppText variant='body'>
                    A short note captured right after therapy locks in the insights that matter. Use these tips as a quick framework the next time you open the notes tab.
                </AppText>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>1. Capture the headline</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Start with one sentence that sums up the main theme of the session. Focus on what felt most important or surprising.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>2. Jot the why</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Note the emotion or trigger that made the moment stick with you. Naming the feeling strengthens recall and helps connect patterns across sessions.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>3. Decide on one tiny action</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Close with a single action or reflection to try before your next session. Keep it realistic—something you can do in five minutes.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
            </ScrollView>
            <View style={ styles.footer }>
                <Button label='Back' onPress={ handleBack } transparent />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    section: {
        gap: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
});
