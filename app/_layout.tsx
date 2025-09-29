import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/TherapySessionsContext';
import { initNotifications } from '../src/utils/schedule-reminders';

function Gate() {
    const { user, hydrated } = useAuth();
    const { hasOnboarded } = useOnboarding();

    if (!hydrated) {
        return null;
    }

    return (
        <Stack screenOptions={ { headerShown: false } }>
            <Stack.Protected guard={ !user }>
                <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={ Boolean(user) && !hasOnboarded }>
                <Stack.Screen name="(onboarding)" />
            </Stack.Protected>
            <Stack.Protected guard={ Boolean(user) && hasOnboarded }>
                <Stack.Screen name="index" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <TherapySessionsProvider>
                <OnboardingProvider>
                    <SafeAreaProvider>
                        <Initializer />
                        <Gate />
                    </SafeAreaProvider>
                </OnboardingProvider>
            </TherapySessionsProvider>
        </AuthProvider>
    );
}

function Initializer() {
    useEffect(() => {
        initNotifications().catch((err) => console.warn('initNotifications failed', err));
    }, []);

    return null;
}
