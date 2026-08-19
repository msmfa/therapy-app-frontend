import { apiGet, apiPost } from './client';

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

/**
 * Shape of a session as returned by the list endpoint, which projects only
 * these fields. All mutations go through syncTherapySessions.
 */
export type TherapySession = {
    _id: string;
    startsAtUtc: string;
    durationMin?: number;
};

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

export async function syncTherapySessions(
    payload: TherapySessionSyncPayload[],
): Promise<TherapySessionSyncResult> {
    return apiPost<TherapySessionSyncResult>(
        '/api/therapy-sessions/sync',
        { sessions: payload },
    );
}
