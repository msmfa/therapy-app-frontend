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

export async function syncTherapySessions(
    payload: TherapySessionSyncPayload[],
    window?: SessionsWindow,
    baseSessions: TherapySession[] = [],
): Promise<TherapySessionSyncResult> {
    const body: {
        sessions: TherapySessionSyncPayload[];
        baseSessions: TherapySessionSyncPayload[];
        from?: string;
        to?: string;
    } = {
        sessions: payload,
        baseSessions: baseSessions.map(session => ({ id: session._id, startsAtUtc: session.startsAtUtc, durationMin: session.durationMin })),
    };

    if (window) {
        // These Dates are already the exact local-midnight boundaries of the
        // editable calendar window. Converting their UTC date parts back to a
        // UTC day widens the deletion range into the previous local day for
        // every non-UTC user, where it can remove a session the UI never
        // showed. Fetching may safely be wider; deletion must stay inside the
        // exact window the user was allowed to edit.
        body.from = window.from.toISOString();
        body.to = window.to.toISOString();
    }

    return apiPost<TherapySessionSyncResult>(
        '/api/therapy-sessions/sync',
        body,
    );
}
