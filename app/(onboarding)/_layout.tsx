import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import Loading from '../../src/components/ui/Loading';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

export default function OnboardingLayout() {
    const { colors } = useTheme();
    const { hydrated } = useOnboardingAnswers();

    // Reading the draft out of the keychain is quick, but not instant. Waiting
    // avoids a resumed flow rendering its questions unanswered and then filling
    // in underneath the user.
    if (!hydrated) {
        return <Loading fullScreen />;
    }

    return (
        <Stack screenOptions={ {
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
        } } >
            <Stack.Screen name="index" />
            <Stack.Screen name="goal" />
            <Stack.Screen name="session-date" />
            <Stack.Screen name="session-cadence" />
            <Stack.Screen name="reminder-times" />
            <Stack.Screen name="plan-preview" />
            <Stack.Screen name="note-preview" />
            <Stack.Screen name="subscription-preview" />
            <Stack.Screen name="account-preview" />
            <Stack.Screen name="notifications-preview" />
            <Stack.Screen
                name="success"
                options={ {
                    gestureEnabled: false,
                    presentation: 'card',
                } }
            />
        </Stack>
    );
}
