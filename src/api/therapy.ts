import { apiDelete, apiGet, apiPost, apiPut, type ApiRequestOptions } from './client';
import type { Reason } from '../features/reminders/types';

/**
 * The calendar API.
 *
 * One read returns everything the calendar screen draws: the sessions, the
 * series they belong to, and the reminder plan the server has materialised for
 * them. Writes are per appointment and commit immediately; the server rebuilds
 * the plan inside the same transaction, so a refetch straight after a write
 * shows the dots the pushes will actually follow.
 */

export type SessionCadence = 'weekly' | 'fortnightly' | 'monthly';

/** How far an edit or a delete reaches when the appointment is part of a series. */
export type SessionEditScope = 'this' | 'future';

/**
 * Shape of a session as the calendar endpoint returns it.
 *
 * `_id` rather than `id` because every consumer of the sessions list, from the
 * reviews feature to the next-session card, was written against the shape the
 * old list endpoint returned. The mapping happens once, in `getCalendar`.
 */
export type TherapySession = {
    _id: string;
    startsAtUtc: string;
    durationMin?: number;
    /** Present when the appointment was created by a repeating series. */
    seriesId?: string;
    /** Edited on its own, so a later "all future sessions" change leaves it be. */
    exception?: boolean;
};

export type TherapySeries = {
    id: string;
    cadence: SessionCadence;
    startsAtUtc: string;
    timeZone: string;
    durationMin?: number;
    /** Exclusive. Absent while the series is open ended. */
    endsAtUtc?: string;
};

export type ReminderKind = 'log_note' | 'review_note';
export type ReminderStatus = 'pending' | 'sent' | 'missed';

/**
 * One row of the plan the cron sends from. Past rows come back too, with
 * `status` saying what became of them, which is how the calendar can show a
 * reminder that has already fired.
 */
export type CalendarReminder = {
    id: string;
    kind: ReminderKind;
    /** Review reminders only: which of the four review moments this is. */
    reason?: Reason;
    dueAtUtc: string;
    /** The calendar day this belongs to in the user's zone, as YYYY-MM-DD. */
    localDate: string;
    /** The session this follows; for a review, the one that opened the gap. */
    sessionId: string;
    nextSessionId?: string;
    gapIndex?: number;
    status: ReminderStatus;
};

export type CalendarSnapshot = {
    /** Bumped on every write. Sent back as If-Match so a stale edit is refused. */
    revision: number;
    timeZone: string;
    morningReminderMinutes: number;
    eveningReminderMinutes: number;
    sessions: TherapySession[];
    series: TherapySeries[];
    reminders: CalendarReminder[];
};

type WireSession = Omit<TherapySession, '_id'> & { id: string };
type WireCalendar = Omit<CalendarSnapshot, 'sessions'> & { sessions: WireSession[] };

const fromWire = ({ id, ...session }: WireSession): TherapySession => ({ _id: id, ...session });

export async function getCalendar(from: Date, to: Date): Promise<CalendarSnapshot> {
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const wire = await apiGet<WireCalendar>(`/api/calendar?${params.toString()}`);
    return { ...wire, sessions: wire.sessions.map(fromWire) };
}

/**
 * The revision the client last saw, for the server to compare against.
 *
 * Optional because a client that has never loaded the calendar has nothing to
 * compare, and refusing its first write would be wrong; the server treats an
 * absent header as "no expectation".
 */
const ifMatch = (revision?: number): Pick<ApiRequestOptions, 'headers'> =>
    revision === undefined ? {} : { headers: { 'If-Match': `"${revision}"` } };

export type CreateSessionInput = {
    startsAtUtc: Date;
    durationMin?: number;
    /** Omit for a one-off appointment. */
    repeat?: SessionCadence;
};

export type SessionWriteResult = {
    revision: number;
    session: TherapySession;
    series?: TherapySeries;
    created: number;
};

type WireSessionWrite = Omit<SessionWriteResult, 'session'> & { session: WireSession };

export async function createSession(
    input: CreateSessionInput,
    revision?: number,
): Promise<SessionWriteResult> {
    const wire = await apiPost<WireSessionWrite>('/api/therapy-sessions', {
        startsAtUtc: input.startsAtUtc.toISOString(),
        ...(input.durationMin === undefined ? {} : { durationMin: input.durationMin }),
        ...(input.repeat === undefined ? {} : { repeat: input.repeat }),
    }, ifMatch(revision));
    return { ...wire, session: fromWire(wire.session) };
}

export type UpdateSessionInput = {
    startsAtUtc?: Date;
    durationMin?: number;
    scope?: SessionEditScope;
};

export async function updateSession(
    id: string,
    input: UpdateSessionInput,
    revision?: number,
): Promise<{ revision: number; session: TherapySession }> {
    const wire = await apiPut<{ revision: number; session: WireSession }>(
        `/api/therapy-sessions/${encodeURIComponent(id)}`,
        {
            ...(input.startsAtUtc === undefined ? {} : { startsAtUtc: input.startsAtUtc.toISOString() }),
            ...(input.durationMin === undefined ? {} : { durationMin: input.durationMin }),
            ...(input.scope === undefined ? {} : { scope: input.scope }),
        },
        ifMatch(revision),
    );
    return { revision: wire.revision, session: fromWire(wire.session) };
}

export async function deleteSession(
    id: string,
    scope: SessionEditScope = 'this',
    revision?: number,
): Promise<{ revision: number; deleted: number }> {
    const params = new URLSearchParams({ scope });
    return apiDelete<{ revision: number; deleted: number }>(
        `/api/therapy-sessions/${encodeURIComponent(id)}?${params.toString()}`,
        ifMatch(revision),
    );
}
