import { calendarSessionDates, WEEKLY_REPEAT_COUNT } from '../calendarSchedule';
import { getSessionsWindow, isWithinSessionsWindow } from '../../../utils/sessionWindow';

const now = new Date(2026, 8, 5, 12);

it('preserves the time and seven-day spacing of an ordinary eight-session series', () => {
    const dates = calendarSessionDates(new Date(2026, 8, 8, 17, 30), WEEKLY_REPEAT_COUNT, now);
    expect(dates).toHaveLength(8);
    dates.forEach((date, index) => {
        expect(date.getDay()).toBe(2);
        expect(date.getHours()).toBe(17);
        expect(date.getMinutes()).toBe(30);
        const expected = new Date(2026, 8, 8 + index * 7, 17, 30);
        expect(date).toEqual(expected);
    });
});

it('keeps the final allowed evening but rejects dates outside the window', () => {
    const window = getSessionsWindow(now);
    expect(calendarSessionDates(new Date(2027, 8, 5, 23, 30), 8, now)).toEqual([new Date(2027, 8, 5, 23, 30)]);
    expect(calendarSessionDates(new Date(2027, 8, 6, 9), 1, now)).toEqual([]);
    expect(calendarSessionDates(new Date(2026, 8, 4, 9), 1, now)).toEqual([]);
    expect(isWithinSessionsWindow(new Date(NaN), window)).toBe(false);
});
