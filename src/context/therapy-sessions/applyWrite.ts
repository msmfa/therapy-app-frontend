import type { CalendarSnapshot, SessionEditScope, TherapySeries, TherapySession } from '../../api/therapy';

/** What every calendar write answers with. Creates and moves also return the session. */
export type CalendarWriteResult = {
    revision: number;
    session?: TherapySession;
    series?: TherapySeries;
    /** Sessions the write made. A new series answers with only the first of them. */
    created?: number;
};

/**
 * What a write did, in terms the calendar on the device can replay.
 * `save`: a create, or an edit to one appointment; the answer carries it.
 * `delete`: one appointment, or with `future` it and the rest of its series.
 * `moveFuture`: the series is cut at `id` and its later sessions re-timed by
 * rules only the server applies.
 * `clearFuture`: clear or replace; everything from `from` on goes, by the
 * server's clock rather than this one.
 */
export type CalendarChange =
    | { kind: 'save' }
    | { kind: 'delete'; id: string; scope: SessionEditScope }
    | { kind: 'moveFuture'; id: string }
    | { kind: 'clearFuture'; from: number };

const byStart = (a: TherapySession, b: TherapySession) =>
    Date.parse(a.startsAtUtc) - Date.parse(b.startsAtUtc);

/**
 * The rows a write took off the calendar, or moved to times the device cannot
 * know, and whether what is left plus the returned rows is the whole result.
 */
function replay(sessions: TherapySession[], change: CalendarChange): { gone: Set<string>; exact: boolean } {
    if (change.kind === 'save') return { gone: new Set(), exact: true };
    if (change.kind === 'clearFuture') {
        const gone = sessions.filter((row) => Date.parse(row.startsAtUtc) >= change.from);
        return { gone: new Set(gone.map((row) => row._id)), exact: false };
    }
    const pivot = sessions.find((row) => row._id === change.id);
    if (change.kind === 'delete' && change.scope === 'this') return { gone: new Set([change.id]), exact: true };
    if (!pivot?.seriesId) return { gone: new Set([change.id]), exact: false };
    const tail = sessions.filter((row) => row.seriesId === pivot.seriesId
        && Date.parse(row.startsAtUtc) >= Date.parse(pivot.startsAtUtc));
    return { gone: new Set(tail.map((row) => row._id)), exact: change.kind === 'delete' };
}

/**
 * The calendar with a committed write applied, for the time until the refetch
 * replaces it. Rows the write removed or moved out of sight go, with the
 * reminders that hang off them, and a returned session or series replaces its
 * old copy. The revision moves on only when that is everything the write did:
 * otherwise the next edit is refused as stale and refetches, rather than being
 * saved against rows the user is not seeing. An answer the calendar has
 * already moved past changes nothing.
 */
export function applyWrite(
    snapshot: CalendarSnapshot,
    written: CalendarWriteResult,
    change: CalendarChange,
): CalendarSnapshot {
    if (written.revision <= snapshot.revision) return snapshot;
    const { session, series } = written;
    const { gone, exact } = replay(snapshot.sessions, change);
    const kept = snapshot.sessions.filter((row) => !gone.has(row._id) && row._id !== session?._id);
    return {
        ...snapshot,
        revision: exact && (written.created ?? 0) <= 1 ? written.revision : snapshot.revision,
        sessions: session ? [...kept, session].sort(byStart) : kept,
        series: series
            ? [...snapshot.series.filter((existing) => existing.id !== series.id), series]
            : snapshot.series,
        reminders: snapshot.reminders.filter((reminder) => !gone.has(reminder.sessionId)
            && !(reminder.nextSessionId !== undefined && gone.has(reminder.nextSessionId))),
    };
}
