import { BASE_URL } from "../const";

const normalizeToken = (token: string): string => {
    const normalized = token.trim().replace(/^bearer\s+/i, '').trim();
    return normalized;
};

const buildAuthHeader = (token: string): string => {
    const normalized = normalizeToken(token);
    if (!normalized) throw new Error('Missing authentication token');
    return `Bearer ${normalized}`;
};

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
    token: string,
    sessionId: string,
    startsAtUtc: Date,
    durationMinutes: number,
): Promise<TherapySession> => {
    const response = await fetch(`${BASE_URL}/api/therapy-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
            Authorization: buildAuthHeader(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startsAtUtc: startsAtUtc.toISOString(),
            durationMinutes,
        }),
    });

    if (!response.ok) throw new Error(await response.text());

    return (await response.json()) as TherapySession;
};

export async function createTherapySession(
    token: string,
    startsAt: Date,
    durationMin?: number,
): Promise<TherapySession> {
    const res = await fetch(`${BASE_URL}/api/therapy-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: buildAuthHeader(token) },
        body: JSON.stringify({ startsAtUtc: startsAt.toISOString(), durationMin }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as TherapySession;
}

export async function getTherapySessions(
    token: string,
    from: Date,
    to: Date,
): Promise<TherapySession[]> {
    // Convert to UTC start of day for 'from'
    const fromUTC = new Date(Date.UTC(
        from.getUTCFullYear(),
        from.getUTCMonth(),
        from.getUTCDate(),
        0, 0, 0, 0
    ));

    // Convert to UTC end of day for 'to'
    const toUTC = new Date(Date.UTC(
        to.getUTCFullYear(),
        to.getUTCMonth(),
        to.getUTCDate(),
        23, 59, 59, 999
    ));

    const qs = new URLSearchParams({
        from: fromUTC.toISOString(),
        to: toUTC.toISOString()
    });

    const res = await fetch(`${BASE_URL}/api/therapy-sessions?${qs}`, {
        headers: { Authorization: buildAuthHeader(token) },
    });
    if (!res.ok) throw new Error(await res.text());
    const response = await res.json() as TherapySession[];

    return response;
}

export async function deleteTherapySession(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/therapy-sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: buildAuthHeader(token) },
    });
    if (!res.ok) throw new Error(await res.text());
}

export async function syncTherapySessions(
    token: string,
    payload: TherapySessionSyncPayload[],
): Promise<TherapySessionSyncResult> {
    const res = await fetch(`${BASE_URL}/api/therapy-sessions/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: buildAuthHeader(token),
        },
        body: JSON.stringify({ sessions: payload }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as TherapySessionSyncResult;
}

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
