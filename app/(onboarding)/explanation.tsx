import React, { JSX } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';

export default function ExplanationScreen(): JSX.Element {
    const router = useRouter();

    const handleNext = () => {
        router.push('/(onboarding)/reminders');
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <Text style={ styles.title }>Why we plan your reminders</Text>
                <Text style={ styles.body }>
                    We tailor your follow-up reminders using your therapy schedule so you can capture insights
                    while they are fresh. This keeps your notes meaningful and easy to recall later.
                </Text>
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
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1f1f1f',
        textAlign: 'center',
    },
    body: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
        textAlign: 'center',
    },
    footer: {
        paddingTop: 16,
    },
});
