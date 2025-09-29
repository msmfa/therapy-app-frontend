import dayjs from 'dayjs';
import { calculateReminderPlan } from '../components/reminders/reminder-schedule-algo';
import { scheduleNoteReminder } from './schedule-reminders';

export async function scheduleTherapyReminders(
    noteId: string,
    message: string,
    sessions: Date[],
) {

    // todo: change this to use calculateReminderPlan instead
    const reminderTimes = calculateReminderPlan(sessions);

    await Promise.all(
        reminderTimes
            .filter((when) => dayjs(when).isAfter(dayjs()))
            .map((when) => scheduleNoteReminder(noteId, message, when)),
    );
}
