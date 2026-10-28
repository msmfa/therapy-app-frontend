import type { CalendarSnapshot, TherapySeries, TherapySession } from '../../api/therapy';

/** What every calendar write answers with. Creates and moves also return the session. */
export type CalendarWriteResult = {
    revision: number;
    session?: TherapySession;
    series?: TherapySeries;
};

const byStart = (a: TherapySession, b: TherapySession) =>
    Date.parse(a.startsAtUtc) - Date.parse(b.startsAtUtc);

/**
 * The calendar with a committed write applied, for the time until the refetch
 * replaces it. The revision always moves on, so the next edit is not refused
 * as stale, and a returned session or series replaces its old copy. Deletes
 * and whole-schedule writes return no rows, so only their revision applies.
 * An answer the calendar has already moved past changes nothing.
 */
export function applyWrite(snapshot: CalendarSnapshot, written: CalendarWriteResult): CalendarSnapshot {
    if (written.revision <= snapshot.revision) return snapshot;
    const { session, series } = written;
    return {
        ...snapshot,
        revision: written.revision,
        sessions: session
            ? [...snapshot.sessions.filter((existing) => existing._id !== session._id), session].sort(byStart)
            : snapshot.sessions,
        series: series
            ? [...snapshot.series.filter((existing) => existing.id !== series.id), series]
            : snapshot.series,
    };
}
