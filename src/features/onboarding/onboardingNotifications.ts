import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { cancelNotificationById } from '../../services/notifications';
import { analytics } from '../analytics/client';

/**
 * The local reminder onboarding schedules, and the record of it.
 *
 * Scheduling returns an identifier that has to be kept: without it the
 * notification cannot be cancelled later, so changing the session date, running
 * onboarding again, or signing out left an orphan that still fired. Keeping one
 * identifier also makes replacement possible -- schedule, then cancel whatever
 * the previous run left behind.
 *
 * New builds use the backend for the whole schedule, including the first
 * reminder. The stored id remains so an upgrade can remove the duplicate local
 * notification created by an older onboarding build.
 */

const STORAGE_KEY = 'onboarding.localReminder.v1';

async function readStoredId(): Promise<string | null> {
    try {
        return await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
        return null;
    }
}

async function writeStoredId(identifier: string | null): Promise<void> {
    try {
        if (identifier === null) {
            await SecureStore.deleteItemAsync(STORAGE_KEY);
        } else {
            await SecureStore.setItemAsync(STORAGE_KEY, identifier);
        }
    } catch (error) {
        console.warn('[onboarding] could not record the local reminder id:', error);
    }
}

/** Cancels whatever onboarding scheduled last, if anything. */
export async function cancelOnboardingReminder(): Promise<void> {
    const identifier = await readStoredId();
    if (identifier === null) return;

    await cancelNotificationById(identifier);
    await writeStoredId(null);
}

export type PermissionSnapshot = {
    granted: boolean;
    /** False once iOS will no longer show the prompt; Settings is the only way. */
    canAskAgain: boolean;
};

export async function readNotificationPermission(): Promise<PermissionSnapshot> {
    const settings = await Notifications.getPermissionsAsync();

    return {
        granted: settings.status === 'granted',
        canAskAgain: settings.canAskAgain,
    };
}

export async function requestNotificationPermission(
    options: { entryPoint?: 'onboarding' | 'settings' } = {},
): Promise<PermissionSnapshot> {
    const scope = analytics.beginOperation();
    const entry_point = options.entryPoint ?? 'onboarding';
    try {
        const settings = await Notifications.requestPermissionsAsync();
        const provisional = Notifications.IosAuthorizationStatus?.PROVISIONAL;
        scope.capture('notification_setup_result', {
            stage: 'permission',
            entry_point,
            outcome: provisional !== undefined && settings.ios?.status === provisional
                ? 'provisional'
                : settings.status === 'granted'
                    ? 'granted'
                    : settings.status === 'denied' ? 'denied' : 'not_determined',
        });
        return {
            granted: settings.status === 'granted',
            canAskAgain: settings.canAskAgain,
        };
    } catch (error) {
        scope.capture('notification_setup_result', { stage: 'permission', entry_point, outcome: 'failed' });
        throw error;
    }
}
