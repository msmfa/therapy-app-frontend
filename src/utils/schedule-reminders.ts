import { getPostSessionNoteReminders } from '../components/reminders/reminder-schedule-v2';
import type { TherapySession } from '../api/therapy';
import { scheduleNoteNotification } from '../services/notifications';

/**
 * Schedule notifications to remind users to write session notes after therapy.
 */
export async function scheduleTherapySessionNotifications(
    noteId: string,
    message: string,
    sessions: Array<Pick<TherapySession, '_id' | 'startsAtUtc' | 'durationMin'>>,
    minutesAfterSession = 10,
): Promise<void> {
    const plan = getPostSessionNoteReminders({
        sessions,
        nowUtc: new Date().toISOString(),
        minutesAfterSession,
    });

    if (!plan.length) return;

    await Promise.all(
        plan.map(({ remindAtUtc }) => scheduleNoteNotification(noteId, message, new Date(remindAtUtc))),
    );
}
