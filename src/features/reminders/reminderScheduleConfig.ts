// The one place the reminder plan's inputs are declared.
//
// These values were previously inline literals in TherapySessionsContext, and
// duplicated wherever else the schedule had to be recomputed. They have to
// agree everywhere: the reviews feature replays past occurrences to work out
// which reminder a tick answers, and an hour that disagrees with the one used
// when the reminder fired produces an occurrence that never existed.
import type { TherapySession } from '../../api/therapy';

/**
 * Hours and cadence handed to `scheduleNeuroplasticityReminders`.
 *
 * Mirrors the backend's reminderSchedule.ts in the same way the scheduler
 * itself does; the two decide the same reminders and have to agree.
 */
export const REMINDER_SCHEDULE = {
    reflectionHour: 20,
    morningHour: 7,
    startAfterDays: 3,
    cadenceDays: 4,
} as const;

/**
 * Assumed length of a session whose duration was never recorded.
 *
 * `durationMin` is optional on the API, so a session can arrive without one.
 * Treating that as zero-length left the reminder plan with no session end to
 * stay clear of, and showed reminders landing inside the session. 50 is what
 * both write paths send, so an unknown session is assumed to look like every
 * session the app itself creates.
 *
 * Mirrors DEFAULT_SESSION_MINUTES in the backend's notificationCron.helpers.ts:
 * the two have to agree or the plan shown here drifts from the pushes sent.
 */
export const DEFAULT_SESSION_MINUTES = 50;

export const effectiveDurationMin = (durationMin?: number | null): number =>
    typeof durationMin === 'number' && Number.isFinite(durationMin) && durationMin > 0
        ? durationMin
        : DEFAULT_SESSION_MINUTES;

export interface SessionScheduleInputs {
    sessionsUtc: string[];
    /**
     * Durations keyed by the session's `startsAtUtc`, so the plan never
     * promises a reminder while a session is still running.
     */
    sessionDurationsMin: Record<string, number>;
}

/** Turns the session list into the two shapes the scheduler expects. */
export function sessionScheduleInputs(
    sessions: Pick<TherapySession, 'startsAtUtc' | 'durationMin'>[],
): SessionScheduleInputs {
    const sessionsUtc: string[] = [];
    const sessionDurationsMin: Record<string, number> = {};

    for (const session of sessions) {
        if (typeof session.startsAtUtc !== 'string') continue;
        sessionsUtc.push(session.startsAtUtc);
        sessionDurationsMin[session.startsAtUtc] = effectiveDurationMin(session.durationMin);
    }

    return { sessionsUtc, sessionDurationsMin };
}
