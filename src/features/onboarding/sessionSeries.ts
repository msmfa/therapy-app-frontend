import dayjs from 'dayjs';
import type { CadenceId } from './onboardingCopy';

/**
 * The recurring therapy schedule, projected from one confirmed appointment.
 *
 * Once someone tells us when their next session is and that it repeats, the
 * rest of the series follows: same weekday and same time, every week or two, or
 * the same date each month. That is enough to place reviews between real
 * sessions instead of guessing at a gap.
 *
 * A schedule that varies projects nothing beyond the session we were actually
 * told about. Inventing dates there would put appointments in the plan that the
 * user has never booked.
 */

export const SERIES_MONTHS_AHEAD = 6;

/** Defensive ceiling: six months of weekly sessions is 27. */
const MAX_SESSIONS = 32;

type CadenceStep =
    | { unit: 'day'; amount: number }
    | { unit: 'month'; amount: number };

const CADENCE_STEPS: Record<CadenceId, CadenceStep | null> = {
    weekly: { unit: 'day', amount: 7 },
    fortnightly: { unit: 'day', amount: 14 },
    monthly: { unit: 'month', amount: 1 },
    varies: null,
};

export type SessionSeriesInputs = {
    firstSessionAt: Date;
    cadence: CadenceId | null;
    monthsAhead?: number;
};

/**
 * Every session from the confirmed one up to the horizon, inclusive.
 *
 * Always returns at least the confirmed session, so callers never have to
 * special-case an empty schedule.
 */
export function projectSessions({
    firstSessionAt,
    cadence,
    monthsAhead = SERIES_MONTHS_AHEAD,
}: SessionSeriesInputs): Date[] {
    const first = dayjs(firstSessionAt);
    const step = cadence === null ? null : CADENCE_STEPS[cadence];

    if (step === null) {
        return [first.toDate()];
    }

    const horizon = first.add(monthsAhead, 'month');
    const sessions: Date[] = [];

    for (let index = 0; index < MAX_SESSIONS; index += 1) {
        const occurrence =
            step.unit === 'day'
                ? first.add(step.amount * index, 'day')
                // Calendar months, so a session on the 31st lands on the last day
                // of a shorter month rather than spilling into the next one.
                : first.add(step.amount * index, 'month');

        if (occurrence.isAfter(horizon)) break;

        // Adding days or months keeps the local wall-clock time, but re-applying
        // it makes that explicit and survives a daylight-saving shift.
        sessions.push(
            occurrence
                .hour(first.hour())
                .minute(first.minute())
                .second(0)
                .millisecond(0)
                .toDate(),
        );
    }

    return sessions;
}

/**
 * The appointment after the confirmed one, or null when none can be known.
 *
 * This is what the plan uses to place the "before your next session" review.
 */
export function nextSessionAfterFirst(inputs: SessionSeriesInputs): Date | null {
    const sessions = projectSessions(inputs);
    return sessions.length > 1 ? sessions[1] : null;
}
