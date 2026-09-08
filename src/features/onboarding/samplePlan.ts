import dayjs from 'dayjs';
import {
    DEFAULT_SESSION_MINUTES,
    LOG_NOTE_MINUTES_AFTER_SESSION,
} from '../reminders/reminderScheduleConfig';

/**
 * A clearly labelled, display-only appointment for the sample-plan path.
 *
 * Its time is derived from the evening time the user chose, leaving room for
 * the session and note prompt before that review. It is never put into answers,
 * sent to the backend or used to schedule a notification.
 */
export function sampleSessionAt(
    eveningMinutes: number,
    now: Date = new Date(),
): Date {
    const earliestSessionMinutes = 9 * 60;
    const latestSessionMinutes = 17 * 60;
    const roomBeforeReview = DEFAULT_SESSION_MINUTES + LOG_NOTE_MINUTES_AFTER_SESSION + 30;
    const sessionMinutes = Math.min(
        latestSessionMinutes,
        Math.max(earliestSessionMinutes, eveningMinutes - roomBeforeReview),
    );

    return dayjs(now)
        .add(3, 'day')
        .startOf('day')
        .add(sessionMinutes, 'minute')
        .toDate();
}
