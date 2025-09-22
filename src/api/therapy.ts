// src/api/therapy.ts
export type TherapySession = {
	_id: string;
	userId: string;
	startsAtUtc: string;
	durationMin?: number;
	createdAt: string;
	updatedAt: string;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export async function listTherapySessions(
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
