import dayjs from 'dayjs';

const REMINDER_SCHEDULE: Record<number, number[]> = {
    // 1-2 days gap
    0: [0],
    1: [0],
    2: [0],
    3: [0, 2], // day 2 is also day-before

    // 4-7 days gap
    4: [0, 2, 3],
    5: [0, 3, 4],
    6: [0, 3, 5],
    7: [0, 2, 6],

    // 8-14 days gap
    8: [0, 2, 5, 7],
    9: [0, 2, 6, 8],
    10: [0, 3, 7, 9],
    11: [0, 3, 7, 10],
    12: [0, 3, 8, 11],
    13: [0, 4, 8, 12],
    14: [0, 4, 9, 13],

    15: [0, 4, 10, 14],
    16: [0, 4, 10, 15],
    17: [0, 5, 11, 16],
    18: [0, 5, 12, 17],
    19: [0, 5, 12, 18],
    20: [0, 5, 13, 19],
    21: [0, 3, 11, 20],

    // 22-31 days gap
    22: [0, 3, 11, 20, 21],
    23: [0, 3, 11, 20, 22],
    24: [0, 3, 11, 20, 23],
    25: [0, 3, 11, 20, 24],
    26: [0, 3, 11, 20, 25],
    27: [0, 3, 11, 20, 26],
    28: [0, 3, 11, 20, 27],
    29: [0, 3, 11, 20, 28],
    30: [0, 3, 11, 20, 29],
    31: [0, 3, 11, 20, 30],
};

export function calculateTherapyReminderTimes(
    lastSession: Date,
    nextSession: Date,
    reminderHour = 20,
): Date[] {
    const daysBetween = dayjs(nextSession).diff(lastSession, 'day');

    // Only handle 1-31 days
    if (daysBetween > 31) return [];

    const scheduledDays = REMINDER_SCHEDULE[daysBetween];
    if (!scheduledDays) return [];
    console.log("scheduledDays", scheduledDays)
    const reminderTimes = scheduledDays.map((day) =>
        day === 0
            ? dayjs(lastSession).add(1, 'hour').toDate()
            : dayjs(lastSession)
                .add(day, 'day')
                .hour(reminderHour)
                .minute(0)
                .second(0)
                .millisecond(0)
                .toDate(),
    );

    return filterAndSort(reminderTimes);
}

function filterAndSort(times: Date[]): Date[] {
    const now = new Date();
    return times.filter((time) => time > now).sort((a, b) => a.getTime() - b.getTime());
}

export function calculateReminderPlan(
    orderedSessions: Date[],
    reminderHour = 20,
): Date[] {
    if (orderedSessions.length < 2) return [];

    const reminders: Date[] = [];

    for (let index = 0; index < orderedSessions.length - 1; index += 1) {
        const windowReminders = calculateTherapyReminderTimes(
            orderedSessions[index],
            orderedSessions[index + 1],
            reminderHour,
        );

        reminders.push(...windowReminders);
    }

    return filterAndSort(reminders);
}
