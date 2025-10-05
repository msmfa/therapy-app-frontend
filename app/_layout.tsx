import { ErrorBoundaryProps, Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { ThemeProvider, DefaultTheme, Theme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/TherapySessionsContext';
import { initNotifications } from '../src/utils/schedule-reminders';
import { colors, gradients } from '../new-design';
import { StatusBar, StyleSheet, View } from 'react-native';
import Loading from '../src/components/ui/Loading';
import { ErrorBoundaryUI } from '../src/components/ErrorBoundary';

const theme: Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: gradients.background.bottom,
        card: colors.bgLight,
        text: colors.text,
    },
};

/**
 * Gate Component
 *
 * Controls navigation based on authentication and onboarding state.
 * Waits for both auth and onboarding to hydrate before determining which route to show.
 *
 * Navigation flow:
 * 1. Not authenticated → (auth) screens (login/signup)
 * 2. Authenticated but not onboarded → (onboarding) screens
 * 3. Authenticated and onboarded → (tabs) main app
 */
export function Gate() {
    const { user, hydrated: authHydrated } = useAuth();
    const { hasOnboarded, hydrated: onboardingHydrated } = useOnboarding();

    // Both providers must be hydrated before we can route
    const isFullyHydrated = authHydrated && onboardingHydrated;
    const isAuthenticated = Boolean(user);

    return (
        <View style={ styles.root }>
            <Stack screenOptions={ { headerShown: false } }>
                { /* Route 1: Authentication screens - show when not authenticated */ }
                <Stack.Protected guard={ !isAuthenticated && authHydrated }>
                    <Stack.Screen name="(auth)" />
                </Stack.Protected>

                { /* Route 2: Onboarding screens - show when authenticated but not onboarded */ }
                <Stack.Protected guard={ isAuthenticated && isFullyHydrated && !hasOnboarded }>
                    <Stack.Screen name="(onboarding)" />
                </Stack.Protected>

                { /* Route 3: Main app - show when authenticated and onboarded */ }
                <Stack.Protected guard={ isAuthenticated && isFullyHydrated && hasOnboarded }>
                    <Stack.Screen name="(tabs)" options={ { headerShown: false } } />
                </Stack.Protected>

            </Stack>

            { /* Show loading overlay until all providers are hydrated */ }
            { !isFullyHydrated && <Loading text="Loading your account..." /> }
        </View>
    );
}

/**
 * Root Layout Component
 *
 * Provider hierarchy (order matters!):
 * 1. ThemeProvider - must wrap everything for styling
 * 2. AuthProvider - hydrates first, determines user
 * 3. TherapySessionsProvider - can mount early, doesn't depend on user
 * 4. OnboardingProvider - waits for auth to hydrate, then hydrates based on user
 * 5. SafeAreaProvider - handles device safe areas
 *
 * The Gate component waits for both Auth and Onboarding to hydrate before routing.
 */
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

/**
 * Initializer Component
 *
 * Handles one-time initialization tasks like setting up notifications.
 * Separated from RootLayout for clarity.
 */
function Initializer() {
    useEffect(() => {
        initNotifications().catch((err) => {
            console.warn('[Initializer] notification setup failed:', err);
        });
    }, []);

    return null;
}

/**
 * Error Boundary
 *
 * Catches and displays errors that occur anywhere in the component tree.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return <ErrorBoundaryUI error={ error } retry={ retry } />;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.bg,
    },
});
