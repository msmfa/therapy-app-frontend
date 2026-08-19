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

export type SessionsWindow = {
    from: Date;
    to: Date;
};

/**
 * The exact UTC instants a `[from, to]` pair widens to when querying the
 * backend. Shared between fetching and syncing so the sync's deletion scope
 * can never exceed the window the client actually loaded.
 */
export const toUtcDayRange = (from: Date, to: Date): { fromUTC: Date; toUTC: Date } => {
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

    return { fromUTC, toUTC };
};

export async function getTherapySessions(
    from: Date,
    to: Date,
): Promise<TherapySession[]> {
    const { fromUTC, toUTC } = toUtcDayRange(from, to);

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
    window?: SessionsWindow,
): Promise<TherapySessionSyncResult> {
    const body: {
        sessions: TherapySessionSyncPayload[];
        from?: string;
        to?: string;
    } = { sessions: payload };

    if (window) {
        // Send the widened instants the fetch actually queried with, so the
        // backend's deletion scope matches what the user could see and edit.
        const { fromUTC, toUTC } = toUtcDayRange(window.from, window.to);
        body.from = fromUTC.toISOString();
        body.to = toUTC.toISOString();
    }

    return apiPost<TherapySessionSyncResult>(
        '/api/therapy-sessions/sync',
        body,
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
