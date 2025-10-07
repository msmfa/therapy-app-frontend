import { apiDelete, apiGet, apiPost, apiPut } from './client';

type TherapySessionSyncPayload = {
    id?: string;
    startsAtUtc: string;
    durationMin?: number;
};

type TherapySessionSyncResult = {
    created: number;
    updated: number;
    deleted: number;
};

export type TherapySession = {
    _id: string;
    userId: string;
    startsAtUtc: string;
    durationMin?: number;
    createdAt: string;
    updatedAt: string;
};

export const updateTherapySession = async (
    sessionId: string,
    startsAtUtc: Date,
    durationMin: number,
): Promise<TherapySession> =>
    apiPut<TherapySession>(`/api/therapy-sessions/${sessionId}`, {
        startsAtUtc: startsAtUtc.toISOString(),
        durationMin,
    });

export async function createTherapySession(
    startsAt: Date,
    durationMin?: number,
): Promise<TherapySession> {
    return apiPost<TherapySession>(
        '/api/therapy-sessions',
        { startsAtUtc: startsAt.toISOString(), durationMin },
    );
}

export async function getTherapySessions(
    from: Date,
    to: Date,
): Promise<TherapySession[]> {
    const fromUTC = new Date(Date.UTC(
        from.getUTCFullYear(),
        from.getUTCMonth(),
        from.getUTCDate(),
        0,
        0,
        0,
        0,
    ));

    const toUTC = new Date(Date.UTC(
        to.getUTCFullYear(),
        to.getUTCMonth(),
        to.getUTCDate(),
        23,
        59,
        59,
        999,
    ));

    const params = new URLSearchParams({
        from: fromUTC.toISOString(),
        to: toUTC.toISOString(),
    });

    return apiGet<TherapySession[]>(`/api/therapy-sessions?${params.toString()}`);
}

export async function deleteTherapySession(id: string): Promise<void> {
    await apiDelete<void>(`/api/therapy-sessions/${id}`, { parseJson: false });
}

export async function syncTherapySessions(
    payload: TherapySessionSyncPayload[],
): Promise<TherapySessionSyncResult> {
    return apiPost<TherapySessionSyncResult>(
        '/api/therapy-sessions/sync',
        { sessions: payload },
    );
}

export async function getNextSession(): Promise<Date | null> {
    const now = new Date();
    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(now.getMonth() + 2);

    try {
        const sessions = await getTherapySessions(now, twoMonthsLater);
        const futureSessions = sessions
            .map((session) => new Date(session.startsAtUtc))
            .filter((date) => date > now);

        if (futureSessions.length === 0) {
            return null;
        }

        return futureSessions.reduce((earliest, current) => (current < earliest ? current : earliest));
    } catch (error) {
        console.error('Failed to fetch therapy sessions:', error);
        return null;
    }
}
