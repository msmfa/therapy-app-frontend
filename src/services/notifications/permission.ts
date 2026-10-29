import * as Notifications from 'expo-notifications';
import { analytics } from '../../features/analytics/client';
import { ensurePushRegistration } from './pushRegistration';

/**
 * Reading and asking for notification permission. Onboarding asks on its own
 * screen, Reminder settings on a tap, and the app itself once a session is
 * added or when it opens with reminders to come.
 */

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
    options: { entryPoint?: 'onboarding' | 'settings' | 'app_start' } = {},
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

let askInFlight: Promise<void> | null = null;
let askedThisRun = false;

async function askIfUndetermined(): Promise<void> {
    try {
        const current = await readNotificationPermission();
        if (current.granted || !current.canAskAgain) return;
        askedThisRun = true;
        // No analytics entry point names this yet; 'app_start' is the one for
        // asks the app makes on its own rather than from onboarding or Settings.
        const answer = await requestNotificationPermission({ entryPoint: 'app_start' });
        if (answer.granted) await ensurePushRegistration({ entryPoint: 'app_start' });
    } catch (error) {
        console.warn('[notifications] asking for notification permission failed:', error);
    }
}

/**
 * The one ask the app makes on its own, shared by the two moments below. Only
 * while the system has not decided, at most once per app run, and it never
 * rejects, so nothing it follows can fail because of it. A grant registers the
 * device straight away, so the reminders the calendar lists have a phone to go to.
 */
function askOncePerRun(): Promise<void> {
    if (askedThisRun) return Promise.resolve();
    if (askInFlight === null) {
        const request = askIfUndetermined();
        askInFlight = request;
        void request.finally(() => {
            if (askInFlight === request) askInFlight = null;
        });
    }
    return askInFlight;
}

/** After a session is added: the sample plan, or anyone onboarding never asked. */
export function askForNotificationsAfterSessionAdded(): Promise<void> {
    return askOncePerRun();
}

/**
 * When the app opens with reminders still to come: the users no add ever
 * reaches, such as a series set up before a reinstall or on another phone.
 */
export function askForNotificationsOnOpen(): Promise<void> {
    return askOncePerRun();
}

/**
 * The user just chose "Not now" in onboarding, so the app does not ask again
 * on its own until the next launch.
 */
export function skipNotificationAskThisRun(): void {
    askedThisRun = true;
}
