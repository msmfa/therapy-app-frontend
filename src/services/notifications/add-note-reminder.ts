import { cancelNotificationsById } from './index';

export async function cancelAddNoteReminderNotifications(notificationIds: string[]): Promise<void> {
    await cancelNotificationsById(notificationIds);
}
