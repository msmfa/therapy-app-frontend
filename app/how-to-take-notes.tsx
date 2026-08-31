import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';
import {
    POST_THERAPY_QUESTIONS,
    POST_THERAPY_TEMPLATE_INTRO,
    POST_THERAPY_TEMPLATE_SUBTITLE,
    POST_THERAPY_TEMPLATE_TITLE,
} from 'src/constants/postTherapyTemplate';


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
                <AppText variant="h1">{ POST_THERAPY_TEMPLATE_TITLE }</AppText>

                <Spacer variant={ SpacerVariant.large } />
                <AppText variant="h2">{ POST_THERAPY_TEMPLATE_SUBTITLE }</AppText>
                <Spacer variant={ SpacerVariant.small } />
                <AppText variant="body">{ POST_THERAPY_TEMPLATE_INTRO }</AppText>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.questionList }>
                    { POST_THERAPY_QUESTIONS.map((item, index) => (
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
