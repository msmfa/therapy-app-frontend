import { getTherapySessions, TherapySession } from '../api/therapy';

export async function getNextSession(token: string): Promise<Date | null> {
    const now = new Date();
    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(now.getMonth() + 2);

    try {
        const sessions = (await getTherapySessions(token, now, twoMonthsLater)) as TherapySession[];

        // Find the earliest future session
        const futureSessions = sessions
            .filter((s) => new Date(s.startsAtUtc) > now)
            .map((s) => new Date(s.startsAtUtc));

        if (futureSessions.length === 0) return null;

        // Return the earliest one
        return futureSessions.reduce((earliest, current) =>
            current < earliest ? current : earliest,
        );
    } catch (error) {
        console.error('Failed to fetch therapy sessions:', error);
        return null;
    }
}
