import type { CalendarReminder, CalendarSnapshot, TherapySession } from '../../api/therapy';
import type { Reminder } from '../reminders/types';
import { getSessionsWindow } from '../../utils/sessionWindow';

/**
 * How far behind the editable window the calendar fetches. The reviews feature
 * attributes a note to the gap between two sessions, and the session that
 * opened the gap is usually already in the past by the time a reminder is
 * answered. 90 days is far longer than any gap the schedule can span.
 */
export const CALENDAR_HISTORY_DAYS = 90;

/** The window the app fetches: the editable window plus the recent past. */
export const getCalendarFetchWindow = (now: Date = new Date()) => {
    const { from, to } = getSessionsWindow(now);
    const fetchFrom = new Date(from);
    fetchFrom.setDate(fetchFrom.getDate() - CALENDAR_HISTORY_DAYS);
    return { from: fetchFrom, to };
};

/** The sessions the user can still edit: local midnight today onward. */
export const editableSessionsFrom = (
    sessions: TherapySession[],
    now: Date = new Date(),
): TherapySession[] => {
    const floor = new Date(now);
    floor.setHours(0, 0, 0, 0);
    const floorMs = floor.getTime();
    return sessions.filter((session) => new Date(session.startsAtUtc).getTime() >= floorMs);
};

export const nextSessionOf = (
    sessions: TherapySession[],
    now: Date = new Date(),
): TherapySession | null => {
    const nowMs = now.getTime();
    let earliest: TherapySession | null = null;
    let earliestStart = Number.POSITIVE_INFINITY;
    for (const session of sessions) {
        const start = new Date(session.startsAtUtc).getTime();
        if (start > nowMs && start < earliestStart) {
            earliest = session;
            earliestStart = start;
        }
    }
    return earliest;
};

/** The next push the server will send, of either kind. */
export const nextReminderOf = (
    reminders: CalendarReminder[],
    now: Date = new Date(),
): CalendarReminder | null => {
    const nowMs = now.getTime();
    let next: CalendarReminder | null = null;
    let nextDue = Number.POSITIVE_INFINITY;
    for (const reminder of reminders) {
        if (reminder.status !== 'pending') continue;
        const due = new Date(reminder.dueAtUtc).getTime();
        if (due >= nowMs && due < nextDue) {
            next = reminder;
            nextDue = due;
        }
    }
    return next;
};

/**
 * The review plan in the shape the interval-science screen and the reviews
 * feature were written against: future review reminders only, no ids.
 */
export const legacyReviewRemindersFrom = (
    reminders: CalendarReminder[],
    now: Date = new Date(),
): Reminder[] => {
    const nowMs = now.getTime();
    return reminders
        .filter((reminder) => reminder.kind === 'review_note'
            && reminder.reason !== undefined
            && reminder.status === 'pending'
            && new Date(reminder.dueAtUtc).getTime() > nowMs)
        .map((reminder) => ({
            atUtc: reminder.dueAtUtc,
            reason: reminder.reason!,
            gapIndex: reminder.gapIndex ?? 0,
            localDate: reminder.localDate,
        }));
};

export const settingsOf = (snapshot: CalendarSnapshot) => ({
    timeZone: snapshot.timeZone,
    morningReminderMinutes: snapshot.morningReminderMinutes,
    eveningReminderMinutes: snapshot.eveningReminderMinutes,
});
