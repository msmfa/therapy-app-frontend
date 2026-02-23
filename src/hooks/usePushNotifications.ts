import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { useAuth } from 'src/context/auth/AuthContext';
import { registerDeviceToken, unregisterDeviceToken } from 'src/api/devices';
import { toError } from 'src/utils/errors';

// Show push notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function getPermissionsGranted(): Promise<boolean> {
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  return status === 'granted';
}

function getProjectId(): string | undefined {
  return (Constants.default ?? Constants)?.expoConfig?.extra?.eas?.projectId as string | undefined;
}

export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const pushTokenRef = useRef<string | null>(null);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // If we have a token stored, unregister it on logout
      const tokenToRemove = pushTokenRef.current;
      if (tokenToRemove) {
        pushTokenRef.current = null;
        unregisterDeviceToken(tokenToRemove).catch((err) => {
          console.warn('[PushNotifications] Failed to unregister token on logout:', err);
        });
      }

      // Clean up the listener
      listenerRef.current?.remove();
      listenerRef.current = null;
      return;
    }

    // Only real devices can receive push notifications
    if (!Device.isDevice) {
      console.info('[PushNotifications] Skipping — not a real device');
      return;
    }

    let cancelled = false;

    async function registerToken() {
      try {
        const granted = await getPermissionsGranted();
        if (!granted) {
          console.info('[PushNotifications] Permission denied — skipping token registration');
          return;
        }

        const projectId = getProjectId();
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

        if (cancelled) return;

        pushTokenRef.current = token;
        const platform = Platform.OS === 'android' ? 'android' : 'ios';
        await registerDeviceToken(token, platform);

        // Listen for token refreshes
        listenerRef.current = Notifications.addPushTokenListener((newToken) => {
          pushTokenRef.current = newToken.data;
          registerDeviceToken(newToken.data, platform).catch((err) => {
            console.warn('[PushNotifications] Failed to update refreshed token:', err);
          });
        });
      } catch (err) {
        if (!cancelled) {
          console.warn('[PushNotifications] Registration failed:', err);
          Sentry.withScope((scope) => {
            scope.setTag('feature', 'push-notifications.registration');
            scope.setContext('device', {
              isDevice: Device.isDevice,
              platform: Platform.OS,
              projectId: getProjectId(),
            });
            Sentry.captureException(toError(err));
          });
        }
      }
    }

    registerToken();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);
}
