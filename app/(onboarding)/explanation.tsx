import React, { JSX } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';
import AppText from '../../src/components/ui/typography';

export default function ExplanationScreen(): JSX.Element {
    const router = useRouter();

    const handleNext = () => {
        router.push('/(onboarding)/reminders');
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <AppText variant='h1' >
                    Why we plan your reminders
                </AppText>
                <AppText variant='body'>
                    We tailor your follow-up reminders using your therapy schedule so you can capture insights
                    while they are fresh. This keeps your notes meaningful and easy to recall later.
                </AppText>
            </View>
            <View style={ styles.footer }>
                <Button label='Next' onPress={ handleNext } />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 16,
    },
    footer: {
        paddingTop: 16,
    },
});
