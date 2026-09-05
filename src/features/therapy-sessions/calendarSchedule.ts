import { getSessionsWindow, isWithinSessionsWindow } from '../../utils/sessionWindow';

export const WEEKLY_REPEAT_COUNT = 8;

/** Keep every generated appointment inside the range the calendar can load. */
export function calendarSessionDates(start: Date, repeatCount: number, now = new Date()): Date[] {
    const window = getSessionsWindow(now);
    if (!isWithinSessionsWindow(start, window)) return [];

    const dates: Date[] = [];
    for (let index = 0; index < repeatCount; index += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + index * 7);
        if (!isWithinSessionsWindow(date, window)) break;
        dates.push(date);
    }
    return dates;
}
