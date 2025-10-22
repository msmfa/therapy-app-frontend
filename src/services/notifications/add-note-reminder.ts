import { scheduleNotificationRequest, cancelNotificationsById, NotificationType } from './index';

const DEFAULT_ADD_NOTE_TITLE = 'Log your therapy session note';

interface AddNoteReminderOptions {
    title?: string;
    data?: Record<string, unknown>;
}

export async function scheduleAddNoteReminderNotification(
    identifier: string,
    body: string,
    when: Date,
    options: AddNoteReminderOptions = {},
): Promise<string> {
    const { title = DEFAULT_ADD_NOTE_TITLE, data = {} } = options;

    return scheduleNotificationRequest({
        identifier,
        title,
        body,
        when,
        data: {
            type: NotificationType.AddNoteReminder,
            ...data,
        },
    });
}

export async function cancelAddNoteReminderNotifications(notificationIds: string[]): Promise<void> {
    await cancelNotificationsById(notificationIds);
}
