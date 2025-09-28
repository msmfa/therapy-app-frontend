import { BASE_URL } from "../const";


export type TherapySessionSyncPayload = {
    id?: string;
    startsAtUtc: string;
    durationMin?: number;
};

export type TherapySessionSyncResult = {
    created: number;
    updated: number;
    deleted: number;
};

// src/api/therapy.ts
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
    // Implementation to update session time
    const response = await fetch(`/api/therapy-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            startsAtUtc: startsAtUtc.toISOString(),
            durationMinutes,
        }),
    });
    return (await response.json()) as TherapySession;
};

export async function createTherapySession(
    token: string,
    startsAt: Date,
    durationMin?: number,
): Promise<TherapySession> {
    console.log(startsAt.toISOString(), 'test1');
    const res = await fetch(`${BASE_URL}/api/therapy-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const response = await res.json() as TherapySession[];

    // console.log("Fetched therapy sessions:", response);

    return response;
}

export async function deleteTherapySession(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/therapy-sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessions: payload }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as TherapySessionSyncResult;
}
