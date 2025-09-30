// app/(onboarding)/success.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';

export default function SuccessScreen() {
    const router = useRouter();
    const { finishOnboarding } = useOnboarding();

    const handleComplete = async () => {
        await finishOnboarding();
        router.push('/(tabs)/notes');
    };

    // TODO: add a icon or image here in the background
    const nextSessionDate = '10am on tuesday'
    const logNoteReminderTime = '8pm'
    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <Text style={ styles.title }>All Set</Text>
                <Text style={ styles.subtitle }>Your next session is at { nextSessionDate }. </Text>
                <Text style={ styles.subtitle }>We'll send you a reminder after your session at { logNoteReminderTime } to remind you to write down your session notes.</Text>
            </View>
            <View style={ styles.buttons }>
                <Button label='Done' onPress={ handleComplete }  />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
    },
});
