// app/(onboarding)/success.tsx
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import Spacer from 'src/components/ui/Spacer';

export default function SuccessScreen() {
    const router = useRouter();
    const { finishOnboarding } = useOnboarding();
    const completionTriggeredRef = useRef(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = useCallback(async () => {
        if (completionTriggeredRef.current) {
            return;
        }

        completionTriggeredRef.current = true;
        setIsCompleting(true);
        await finishOnboarding();
        router.replace('/(tabs)/notes');
    }, [finishOnboarding, router]);


    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <View style={ styles.content }>
                <AppText variant='h1'>
                    Congrats, You're all set up!
                </AppText>
                <Spacer />

            </View>
            <View >
                <Button label='Next' onPress={ handleComplete } loading={ isCompleting } />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
});
