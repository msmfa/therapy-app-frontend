// Asks for notification permission during screenshot runs.
//
// usePushNotifications bails out early on a simulator ("not a real device")
// because there is no APNs token to register there, which is correct for the
// app but means iOS is never asked for authorisation. Without authorisation a
// notification delivered with `xcrun simctl push` is accepted and then silently
// dropped, so the reminder that is the whole point of the product cannot be
// shown in a screenshot.
//
// This only requests permission. It registers nothing and sends nothing; the
// real registration path is untouched.
//
// Inert unless EXPO_PUBLIC_SEED_DEMO=1 in a dev build.
import * as React from 'react';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../../context/auth/AuthContext';
import { isDemoSeedEnabled } from './demoSeed';

export function DemoNotificationPermission(): null {
    const { isAuthenticated } = useAuth();
    const askedRef = React.useRef(false);

    React.useEffect(() => {
        if (!isDemoSeedEnabled() || !isAuthenticated || askedRef.current) return;

        askedRef.current = true;

        void (async () => {
            try {
                const { status } = await Notifications.getPermissionsAsync();
                if (status === 'granted') return;

                const result = await Notifications.requestPermissionsAsync();
                console.log(`[DemoNotifications] Permission: ${result.status}`);
            } catch (error) {
                console.warn('[DemoNotifications] Permission request failed:', error);
            }
        })();
    }, [isAuthenticated]);

    return null;
}
