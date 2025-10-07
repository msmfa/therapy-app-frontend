import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { toError } from '../../utils/errors';

Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        status = request.status;
    }
    return status === 'granted';
}

export async function initNotifications(): Promise<void> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
        });
    }

    const granted = await ensureNotificationPermissions();
    if (!granted) throw new Error('Notification permissions not granted');
}

export async function scheduleNoteNotification(
    noteId: string,
    body: string,
    when: Date,
): Promise<string> {
    if (when.getTime() <= Date.now()) throw new Error('Pick a future date & time');

    const trigger: Notifications.DateTriggerInput = {
        type: SchedulableTriggerInputTypes.DATE,
        date: when,
    };

    return Notifications.scheduleNotificationAsync({
        content: {
            title: 'Time to log your therapy session',
            body,
            data: { noteId },
        },
        trigger,
    });
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
        Sentry.withScope((scope) => {
            scope.setTag('feature', 'notifications.cancel');
            scope.setContext('notification', { notificationId });
            Sentry.captureException(toError(err));
        });
        console.warn('cancelScheduledNotification failed', err);
    }
}
