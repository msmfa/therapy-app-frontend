import * as SecureStore from 'expo-secure-store';
import { cancelNotificationById } from '../../services/notifications';

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

// The permission helpers live with the rest of the notification services, so
// the calendar can ask after a session is added without importing this file.
export {
    readNotificationPermission,
    requestNotificationPermission,
    skipNotificationAskThisRun,
    type PermissionSnapshot,
} from '../../services/notifications/permission';
