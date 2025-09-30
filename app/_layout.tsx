import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { ThemeProvider, DefaultTheme, Theme } from '@react-navigation/native';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/TherapySessionsContext';
import { initNotifications } from '../src/utils/schedule-reminders';
import { Palette } from '../design';
import { StatusBar } from 'react-native';


const theme: Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background:'#DBE0E4', // screen backgrounds
        card: '#DBE0E4', // headers & tab bar
        text: Palette.black,
    },
};

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
                <Stack.Screen name="(tabs)" options={ { headerShown: false } } />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {

    return (
        <ThemeProvider value={ theme }>
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
            <StatusBar barStyle="dark-content" backgroundColor={ theme.colors.background } />
        </ThemeProvider>
    );
}

function Initializer() {
    useEffect(() => {
        initNotifications().catch((err) => console.warn('initNotifications failed', err));
    }, []);

    return null;
}
