import { scheduleNotificationRequest, cancelNotificationsById, NotificationType } from './index';

const DEFAULT_REVIEW_TITLE = 'Review your therapy note';

interface ReviewNoteReminderOptions {
    title?: string;
    data?: Record<string, unknown>;
}

export async function scheduleReviewNoteReminderNotification(
    identifier: string,
    body: string,
    when: Date,
    options: ReviewNoteReminderOptions = {},
): Promise<string> {
    const { title = DEFAULT_REVIEW_TITLE, data = {} } = options;

    return scheduleNotificationRequest({
        identifier,
        title,
        body,
        when,
        data: {
            type: NotificationType.ReviewNoteReminder,
            ...data,
        },
    });
}

export async function cancelReviewNoteReminderNotifications(notificationIds: string[]): Promise<void> {
    await cancelNotificationsById(notificationIds);
}
