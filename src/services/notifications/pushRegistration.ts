import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerDeviceToken, unregisterDeviceToken } from '../../api/devices';
import { toError } from '../../utils/errors';

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'permission_denied' }
  | { status: 'unsupported' }
  | { status: 'failed' };

let currentPushToken: string | null = null;
let tokenListener: Notifications.Subscription | null = null;
let registrationInFlight: Promise<PushRegistrationResult> | null = null;
let tokenRefreshInFlight: Promise<void> | null = null;
// Invalidates callbacks that began for a session which has since signed out.
let lifecycleGeneration = 0;

function removeTokenRefreshListener(): void {
    tokenListener?.remove();
    tokenListener = null;
}

function getProjectId(): string | undefined {
    const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: unknown } }
    | undefined;
    const projectId = extra?.eas?.projectId;
    return typeof projectId === 'string' ? projectId : undefined;
}

function reportRegistrationError(error: unknown): void {
    console.warn('[PushNotifications] Registration failed:', error);
    Sentry.withScope((scope) => {
        scope.setTag('feature', 'push-notifications.registration');
        scope.setContext('device', {
            isDevice: Device.isDevice,
            platform: Platform.OS,
            projectId: getProjectId(),
        });
        Sentry.captureException(toError(error));
    });
}

function installTokenRefreshListener(): void {
    if (tokenListener !== null) return;

    const platform = Platform.OS === 'android' ? 'android' : 'ios';
    tokenListener = Notifications.addPushTokenListener(() => {
        // A burst of native rotation events all resolve to Expo's current token.
        // One exchange is sufficient, and keeping a single promise makes logout
        // able to wait for all token work before invalidating authentication.
        if (tokenRefreshInFlight !== null) return;

        const generation = lifecycleGeneration;
        const previousToken = currentPushToken;

        // This listener receives the native APNs/FCM token, not an Expo push
        // token. Sending its `data` directly to Expo's API creates an invalid
        // backend row. Ask Expo for the replacement token after native rotation.
        const request = (async () => {
            try {
                const { data: nextExpoToken } = await Notifications.getExpoPushTokenAsync({
                    projectId: getProjectId(),
                });

                if (generation !== lifecycleGeneration) return;
                await registerDeviceToken(nextExpoToken, platform);

                // A late native callback must not recreate state for an account that
                // signed out while the request was running.
                if (generation !== lifecycleGeneration) return;
                currentPushToken = nextExpoToken;

                // Expo can rotate a token. Register the replacement first so there is
                // never a delivery gap, then remove the obsolete row to prevent every
                // reminder being sent to both tokens until its 90-day TTL expires.
                if (previousToken !== null && previousToken !== nextExpoToken) {
                    await unregisterDeviceToken(previousToken).catch((error) => {
                        console.warn('[PushNotifications] Failed to remove replaced token:', error);
                    });
                }
            } catch (error) {
                reportRegistrationError(error);
            }
        })();

        tokenRefreshInFlight = request;
        void request.finally(() => {
            if (tokenRefreshInFlight === request) tokenRefreshInFlight = null;
        });
    });
}

/**
 * Registers this signed-in device without ever raising the permission prompt.
 *
 * Onboarding owns the prompt. Both onboarding and the root lifecycle call this
 * function afterwards, and the shared in-flight promise ensures they cannot
 * create duplicate registration work.
 */
export async function ensurePushRegistration(): Promise<PushRegistrationResult> {
    if (!Device.isDevice) {
        return { status: 'unsupported' };
    }

    if (registrationInFlight !== null) {
        return registrationInFlight;
    }

    const generation = lifecycleGeneration;
    const request = (async () => {
        try {
            const permission = await Notifications.getPermissionsAsync();
            if (permission.status !== 'granted') {
                // Permission can be revoked in iPhone Settings after registration.
                // Remove the now-unusable backend row while the account is available.
                const token = currentPushToken;
                currentPushToken = null;
                removeTokenRefreshListener();
                if (token !== null) {
                    await unregisterDeviceToken(token).catch((error) => {
                        console.warn('[PushNotifications] Failed to remove disabled token:', error);
                    });
                }
                return { status: 'permission_denied' } as const;
            }

            if (currentPushToken !== null) {
                return { status: 'registered', token: currentPushToken } as const;
            }

            const { data: token } = await Notifications.getExpoPushTokenAsync({
                projectId: getProjectId(),
            });
            const platform = Platform.OS === 'android' ? 'android' : 'ios';

            // Authentication may have changed while the native token lookup was in
            // flight. Do not register this device against whichever account happens
            // to be current now.
            if (generation !== lifecycleGeneration) {
                return { status: 'failed' } as const;
            }

            await registerDeviceToken(token, platform);
            if (generation !== lifecycleGeneration) {
                return { status: 'failed' } as const;
            }
            currentPushToken = token;
            installTokenRefreshListener();

            return { status: 'registered', token } as const;
        } catch (error) {
            reportRegistrationError(error);
            return { status: 'failed' } as const;
        }
    })();

    registrationInFlight = request;
    void request.finally(() => {
        // `resetPushRegistrationState` can let a new account start a different
        // request while this old one winds down. Never clear the newer request.
        if (registrationInFlight === request) registrationInFlight = null;
    });

    return request;
}

/** Removes the server row while auth is still valid, then clears local state. */
export async function unregisterCurrentPushDevice(): Promise<void> {
    // Stop accepting fresh rotation events as soon as logout begins. A registration
    // already in flight can install the listener again, so remove it a second time
    // after that request settles.
    removeTokenRefreshListener();

    // If permission was granted while logout began, wait for that registration
    // to settle so its newly-created row is not left behind.
    await registrationInFlight?.catch(() => undefined);
    removeTokenRefreshListener();
    await tokenRefreshInFlight?.catch(() => undefined);

    const token = currentPushToken;
    lifecycleGeneration += 1;
    currentPushToken = null;

    if (token !== null) {
        await unregisterDeviceToken(token);
    }
}

/** Local teardown for an already-invalid session, where no API call is safe. */
export function resetPushRegistrationState(): void {
    lifecycleGeneration += 1;
    currentPushToken = null;
    removeTokenRefreshListener();
    registrationInFlight = null;
    tokenRefreshInFlight = null;
}

/** Test-only visibility without exposing the token to application UI. */
export function hasRegisteredPushToken(): boolean {
    return currentPushToken !== null;
}
