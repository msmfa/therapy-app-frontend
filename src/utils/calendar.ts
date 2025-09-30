import { TherapySession } from "../api/therapy";

export function convertSessionsToCalendarFormat(sessions: TherapySession[]): { [date: string]: Date } {
    const sessionMap: { [date: string]: Date } = {};

    sessions.forEach(session => {
        const date = new Date(session.startsAtUtc);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        sessionMap[dateString] = date;
    });

    return sessionMap;
}
