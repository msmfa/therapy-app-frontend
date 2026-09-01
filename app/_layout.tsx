import { ErrorBoundaryProps, Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef } from 'react';
import { ThemeProvider, DefaultTheme, Theme } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../src/context/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/onboarding/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/therapy-sessions/TherapySessionsContext';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useTimeZoneSync } from '../src/hooks/useTimeZoneSync';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GRADIENTS } from 'designs/designs-gradients';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import Loading from '../src/components/ui/Loading';
import { ErrorBoundaryUI } from '../src/components/ErrorBoundary';
import * as Sentry from '@sentry/react-native';
import { toError } from '../src/utils/errors';
import * as Notifications from 'expo-notifications';
import { resolveNotificationRoute } from '../src/services/notifications/routing';
import { AppAlertProvider } from '../src/context/alert';
import { useFonts } from 'expo-font';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

// This app handles special-category health data (GDPR Art. 9): therapy session
// notes, appointment times, and the fact of being in therapy at all.
//
// - sendDefaultPii is off. It attaches IP address, user identifiers and
//   request/response data to every event, which sends identifiable health
//   context to a third-party processor.
// - Session Replay is off. It records the screen, and on this app the screen
//   is the user's therapy notes. If it is ever re-enabled it must be with
//   maskAllText and maskAllImages, and covered by the privacy policy and DPA.
Sentry.init({
    dsn: SENTRY_DSN,
    enabled: Boolean(SENTRY_DSN),
    sendDefaultPii: false,
    enableCaptureFailedRequests: true,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.2,
    // @ts-ignore
    enableLogs: true,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [
        // Session Replay deliberately not enabled — see note above.
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
    const { isAuthenticated, hydrated: authHydrated } = useAuth();
    const { hasOnboarded, hydrated: onboardingHydrated } = useOnboarding();

    // Both providers must be hydrated before we can route
    const isFullyHydrated = authHydrated && onboardingHydrated;
    // Routing follows the same definition the API client uses (presence of a
    // token). Keying off `user` instead let the two disagree: a restored user
    // object with no token routed into the app, where every request 401s.
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
    // Brand display font for the note prompt. Rendering is not gated on it:
    // text mounts with the system font and swaps when the file is ready.
    useFonts({
        // Metro turns asset requires into numeric module ids.
        'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf') as number,
        'InstrumentSerif-Italic': require('../assets/fonts/InstrumentSerif-Italic.ttf') as number,
        'GeneralSans-Bold': require('../assets/fonts/GeneralSans-Bold.otf') as number,
        'GeneralSans-Semibold': require('../assets/fonts/GeneralSans-Semibold.otf') as number,
        'GeneralSans-Medium': require('../assets/fonts/GeneralSans-Medium.otf') as number,
        'GeneralSans-Regular': require('../assets/fonts/GeneralSans-Regular.otf') as number,
    });

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

    // Tell the backend which zone to place reminder wall-clock times in
    useTimeZoneSync();

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

/**
 * Notification ids already acted on, kept at module scope rather than in a ref.
 *
 * `router.replace()` here remounts the root layout, which would reset a ref and
 * make the handler forget what it had just handled. Because
 * `getLastNotificationResponse()` keeps returning the same launch response for
 * the whole lifetime of the process, the handler would then treat it as new and
 * navigate again: an unbounded remount loop that re-runs auth hydration and
 * every effect keyed on it, firing a PATCH /api/users/me and a GET
 * /api/therapy-sessions per pass until the app stops rendering entirely. This
 * outlives the remount, so a given notification is acted on exactly once.
 */
const handledNotificationIds = new Set<string>();

function NotificationNavigationHandler({ isReady }: NotificationNavigationHandlerProps) {
    const router = useRouter();
    const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

    const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse | null) => {
        if (!response) return;

        const notificationId = response.notification.request.identifier;

        // Prevent duplicate handling
        if (handledNotificationIds.has(notificationId)) {
            return;
        }

        // Marked only once we are actually going to act on it. Marking before
        // the readiness check burned the id on a response that was then
        // dropped, so the tap did nothing.
        if (!isReady) {
            console.warn('[NotificationNavigationHandler] Attempted to handle notification before ready');
            return;
        }

        handledNotificationIds.add(notificationId);

        try {
            // The composer and the notes list are different destinations, and
            // only the push payload says which one this notification wants.
            router.replace(resolveNotificationRoute(response.notification.request.content.data));

            // Drop the response now that it has been acted on. This navigation
            // remounts the root layout, and `getLastNotificationResponse()`
            // otherwise keeps handing the same launch response back to the
            // fresh mount forever. The id set above already stops the loop on
            // its own; this removes the source rather than guarding against it,
            // which is what expo documents the call for. It throws
            // UnavailabilityError where the native method is missing, so a
            // failure here must not take the navigation down with it.
            try {
                Notifications.clearLastNotificationResponse();
            } catch (clearError) {
                console.warn('[NotificationNavigationHandler] Could not clear last notification response:', clearError);
            }
        } catch (error) {
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'notifications.navigation');
                scope.setContext('notification', { notificationId });
                Sentry.captureException(toError(error));
            });
            console.warn('[NotificationNavigationHandler] Navigation error:', error);
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
