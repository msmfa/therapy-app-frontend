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
            // A resumed flow arrives by replace, which makes the current
            // screen the root of the stack. Back from there cannot pop, so
            // the BackButton falls back to replacing with the logical
            // previous screen. A replace animates like a forward push by
            // default, so pressing Back slid the screen in from the right
            // exactly as going forwards did. Replaces inside onboarding are
            // back-shaped, so they animate as pops; the one forward replace
            // opts back in to push below.
            animationTypeForReplace: 'pop',
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
            <Stack.Screen
                name="notifications-preview"
                options={ {
                    // The one forward replace: account creation replaces into
                    // this screen so the account step cannot be returned to.
                    animationTypeForReplace: 'push',
                } }
            />
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
