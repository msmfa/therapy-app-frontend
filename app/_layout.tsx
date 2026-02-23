import { ErrorBoundaryProps, Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef } from 'react';
import { ThemeProvider, DefaultTheme, Theme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/context/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/onboarding/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/therapy-sessions/TherapySessionsContext';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GRADIENTS } from 'designs/designs-gradients';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import Loading from '../src/components/ui/Loading';
import { ErrorBoundaryUI } from '../src/components/ErrorBoundary';
import * as Sentry from '@sentry/react-native';
import { toError } from '../src/utils/errors';
import * as Notifications from 'expo-notifications';
import { AppAlertProvider } from '../src/context/alert';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: Boolean(SENTRY_DSN),
    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,
    enableCaptureFailedRequests: true,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.2,
    // @ts-ignore
    enableLogs: true,
    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
        Sentry.mobileReplayIntegration(),
        // feedbackIntegration() removed - causes crashes on iOS
    ],
    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
});

const theme: Theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: GRADIENTS.background.bottom,
        card: COLOR_VARIANTS.white.primary,
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
    const isMainAppReady = isAuthenticated && isFullyHydrated && hasOnboarded;

    if (!isFullyHydrated) {
        return (
            <View style={ styles.root }>
                <NotificationNavigationHandler isReady={ false } />
                <Loading fullScreen />
            </View>
        );
    }

    return (
        <View style={ styles.root }>
            <NotificationNavigationHandler isReady={ isMainAppReady } />
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

                { /* Catch-all for unmatched routes (e.g., from notification deep links) */ }
                <Stack.Screen name="+not-found" />
            </Stack>
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
export default Sentry.wrap(function RootLayout() {
    return (
        <ThemeProvider value={ theme }>
            <AppAlertProvider>
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
            </AppAlertProvider>
            <StatusBar barStyle="dark-content" backgroundColor={ theme.colors.background } />
        </ThemeProvider>
    );
});

/**
 * Initializer Component
 *
 * Handles one-time initialization tasks like setting up notifications.
 * Separated from RootLayout for clarity.
 */
function Initializer() {
    // Register / unregister the Expo push token with the backend as auth state changes
    usePushNotifications();

    useEffect(() => {
        // Android requires a notification channel for push notifications to appear
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            }).catch((err) => {
                console.warn('[Initializer] Android notification channel setup failed:', err);
            });
        }
    }, []);

    return null;
}

interface NotificationNavigationHandlerProps {
    isReady: boolean;
}

function NotificationNavigationHandler({ isReady }: NotificationNavigationHandlerProps) {
    const router = useRouter();
    const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);
    const handledNotificationIdsRef = useRef<Set<string>>(new Set());

    const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse | null) => {
        if (!response) return;

        const notificationId = response.notification.request.identifier;

        // Prevent duplicate handling
        if (handledNotificationIdsRef.current.has(notificationId)) {
            return;
        }

        handledNotificationIdsRef.current.add(notificationId);

        if (!isReady) {
            console.warn('[NotificationNavigationHandler] Attempted to handle notification before ready');
            return;
        }

        try {
            router.replace('/(tabs)');
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'notifications.navigation');
                scope.setContext('notification', { notificationId });
                Sentry.captureException(toError(error));
            });
            console.warn('[NotificationNavigationHandler] Navigation error:', error);
            // Fallback to main app - if this fails, let it propagate
            router.replace('/(tabs)');
        }
    }, [router, isReady]);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            if (isReady) {
                handleNotificationResponse(response);
                return;
            }
            pendingResponseRef.current = response;
        });

        return () => subscription.remove();
    }, [handleNotificationResponse, isReady]);

    useEffect(() => {
        try {
            const response = Notifications.getLastNotificationResponse();
            if (!response) {
                return;
            }

            if (isReady) {
                handleNotificationResponse(response);
            } else {
                pendingResponseRef.current = response;
            }
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'notifications.getLastResponse');
                Sentry.captureException(toError(error));
            });
            console.warn('[NotificationNavigationHandler] Error getting last notification response:', error);
        }
    }, [handleNotificationResponse, isReady]);

    useEffect(() => {
        if (!isReady || !pendingResponseRef.current) {
            return;
        }

        handleNotificationResponse(pendingResponseRef.current);
        pendingResponseRef.current = null;
    }, [handleNotificationResponse, isReady]);

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
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
});
