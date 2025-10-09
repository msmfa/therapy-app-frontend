// app/(onboarding)/success.tsx
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../src/context/onboarding/OnboardingContext';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import CheckGradients from 'src/components/ui/CheckGradients';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';

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
        <GlassMorphismWithCircle style={ { flex: 1, padding: 6 } } circlePosition={ CirclePosition.BOTTOM_RIGHT }>
            <SafeAreaView style={ styles.container }>
                <View style={ styles.content }>
                    <AppText variant='body' align='center' style={ { position: 'absolute', top: 150, left: 0, right: 0 } }>
                        Congrats, You're all set up!
                    </AppText>
                    <CheckGradients />
                </View>
                <View >
                    <Button label='Next' onPress={ handleComplete } loading={ isCompleting } />
                </View>
            </SafeAreaView>
        </GlassMorphismWithCircle>
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
