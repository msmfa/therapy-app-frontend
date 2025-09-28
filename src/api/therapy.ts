import { BASE_URL } from "../const";

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
    const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const res = await fetch(`${BASE_URL}/api/therapy-sessions?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as TherapySession[];
}

export async function deleteTherapySession(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/therapy-sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
}
