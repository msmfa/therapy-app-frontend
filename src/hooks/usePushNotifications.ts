import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from 'src/context/auth/AuthContext';
import {
    ensurePushRegistration,
    resetPushRegistrationState,
    unregisterCurrentPushDevice,
} from '../services/notifications/pushRegistration';

// Show push notifications even when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function usePushNotifications(): void {
    const { isAuthenticated, registerSignOutTask } = useAuth();

    // De-registering has to happen while the access token is still valid. By the
    // time `isAuthenticated` flips to false the credentials are already gone, so
    // the request would go out unauthenticated and the device would keep
    // receiving reminders after logout.
    useEffect(
        () =>
            registerSignOutTask(async () => {
                try {
                    await unregisterCurrentPushDevice();
                } catch (err) {
                    console.warn('[PushNotifications] Failed to unregister token on logout:', err);
                }
            }),
        [registerSignOutTask],
    );

    useEffect(() => {
        if (!isAuthenticated) {
            // Server de-registration is handled by the sign-out task above. An auth
            // failure deliberately skips network cleanup, but must still release the
            // listener and forget the previous account's token locally.
            resetPushRegistrationState();
            return;
        }

        let cancelled = false;

        const register = async () => {
            const outcome = await ensurePushRegistration();
            if (cancelled) return;

            if (outcome.status === 'permission_denied') {
                console.info('[PushNotifications] Permission denied — skipping token registration');
            } else if (outcome.status === 'unsupported') {
                console.info('[PushNotifications] Skipping — not a real device');
            }
        };

        void register();

        // Covers an existing user enabling notifications in iPhone Settings and a
        // transient registration failure while the app was backgrounded.
        const appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void register();
        });

        return () => {
            cancelled = true;
            appStateSubscription.remove();
        };
    }, [isAuthenticated]);
}
