import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { Reminder, Reason } from '../reminder-schedule-v2';
import { NOTIFICATION_MESSAGES } from '../../../constants/neuroReminders';
import { toError } from '../../../utils/errors';
import {
    cancelReviewNoteReminderNotifications,
    scheduleReviewNoteReminderNotification,
} from '../../../services/notifications/review-note-reminder';

const STORAGE_KEY = 'review.note.reminders';

interface StoredReviewReminder {
    id: string;
    atUtc: string;
    reason: Reason;
}

function isStoredReviewReminder(value: unknown): value is StoredReviewReminder {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<StoredReviewReminder>;
    return typeof candidate.id === 'string' && typeof candidate.atUtc === 'string' &&
        (candidate.reason === 'post_session' || candidate.reason === 'post_sleep' || candidate.reason === 'mid_session' || candidate.reason === 'pre_session');
}

async function loadStoredNotifications(): Promise<StoredReviewReminder[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isStoredReviewReminder);
    } catch (err) {
        console.warn('[review-note-reminder] failed to read storage', err);
        return [];
    }
}

async function persistStoredNotifications(entries: StoredReviewReminder[]): Promise<void> {
    try {
        if (!entries.length) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            return;
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
        console.warn('[review-note-reminder] failed to persist storage', err);
    }
}

function buildNotificationContent(reminder: Reminder) {
    const body = NOTIFICATION_MESSAGES[reminder.reason];
    if (!body) return null;
    return {
        title: 'Keep your therapy insights active',
        body,
        data: {
            reason: reminder.reason,
            atUtc: reminder.atUtc,
            gapIndex: reminder.gapIndex,
            category: 'neuroReminder',
        },
    };
}

export async function syncReviewNoteReminders(reminders: Reminder[]): Promise<void> {
    const previous = await loadStoredNotifications();
    if (previous.length) {
        await cancelReviewNoteReminderNotifications(previous.map((item) => item.id));
    }

    if (!reminders.length) {
        await persistStoredNotifications([]);
        return;
    }

    const scheduled: StoredReviewReminder[] = [];

    for (const reminder of reminders) {
        const when = new Date(reminder.atUtc);
        if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
            continue;
        }

        const content = buildNotificationContent(reminder);
        if (!content) {
            continue;
        }

        try {
            const id = await scheduleReviewNoteReminderNotification(
                reminder.reason,
                content.body,
                when,
                {
                    title: content.title,
                    data: content.data,
                },
            );
            scheduled.push({
                id,
                atUtc: reminder.atUtc,
                reason: reminder.reason,
            });
        } catch (err) {
            Sentry.withScope((scope) => {
                scope.setTag('feature', 'reminders.review.schedule');
                scope.setContext('reminder', {
                    reason: reminder.reason,
                    atUtc: reminder.atUtc,
                });
                Sentry.captureException(toError(err));
            });
            console.warn('[review-note-reminder] schedule failed', reminder, err);
        }
    }

    await persistStoredNotifications(scheduled);
}
