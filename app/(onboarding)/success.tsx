// app/(onboarding)/success.tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import dayjs from 'dayjs';
import AppText from '../../src/components/ui/typography';

export default function SuccessScreen() {
    const router = useRouter();
    const { finishOnboarding } = useOnboarding();
    const { nextSession } = useTherapySessions();

    const handleComplete = async () => {
        await finishOnboarding();
        router.push('/(tabs)/notes');
    };


    const nextSessionDate = nextSession ? dayjs(nextSession.startsAtUtc).format('h:mm A [on] dddd') : 'Unknown';
    const nextSessionPlusOneHour = nextSession ? dayjs(nextSession.startsAtUtc).add(1, 'hour').format('h:mm A') : 'Unknown';
    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <AppText variant='h1'>
                    All Set
                </AppText>
                <AppText  variant='body'>
                    Your next session is at { nextSessionDate }.
                </AppText>
                <AppText variant='body'>
                    We'll send you a reminder after your session at { nextSessionPlusOneHour } to remind you to write down your session notes.
                </AppText>
            </View>
            <View >
                <Button label='Done' onPress={ handleComplete }  />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },

});
