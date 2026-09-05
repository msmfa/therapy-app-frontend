import { TherapySession } from "../api/therapy";

export function convertSessionsToCalendarFormat(sessions: TherapySession[]): { [date: string]: Date } {
    const sessionMap: { [date: string]: Date } = {};

    sessions.forEach(session => {
        const date = new Date(session.startsAtUtc);
        sessionMap[session._id] = date;
    });

    return sessionMap;
}
