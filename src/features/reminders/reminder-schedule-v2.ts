// Neuroplasticity-aware reminder scheduler
// --------------------------------------------------
// For every gap between therapy sessions we surface up to four reminders:
//
// • post_session – evening of the session (reflectionHour on session day)
// • post_sleep   – morning after the session (morningHour)
// • mid_session  – spaced reactivations across long gaps (startAfterDays + cadenceDays)
// • pre_session  – evening before the next session (reflectionHour)
//
// All reminders are:
// • future-facing (never before "now" inside the gap)
// • inside the gap between two sessions, and never during a session
// • limited to maxPerDay with priority pre_session > post_session > post_sleep > mid_session
//
// Calendar arithmetic goes through src/utils/timeZone rather than dayjs's
// timezone plugin. That plugin resolves offsets by round-tripping through
// `new Date(d.toLocaleString('en-US', { timeZone }))`, which Hermes parses as
// Invalid Date, so on device every reminder came out shifted by however many
// minutes past the hour it happened to be. It only reproduced on device, never
// in the Node tests.
//
// This mirrors the backend's src/utils/reminderSchedule.ts. The two decide the
// same reminders and have to agree.
import {
    resolveTimeZone,
    setHourInZone,
    startOfDayInZone,
    addDaysInZone,
    calendarDaysBetweenInZone,
    localDateKeyInZone,
} from '../../utils/timeZone';

// The schedule the server now owns is fetched, not computed here. This module
// survives only to replay *past* occurrences, which the reviews feature needs
// to work out which reminder a note review answered and which `GET /reminders`
// does not serve — it returns the plan ahead of now. The vocabulary is
// re-exported from the wire types so there is still exactly one definition of
// a reminder in the app.
export { Reason } from './types';
export type { Reminder } from './types';
import { Reason } from './types';
import type { Reminder } from './types';

export interface ScheduleParams {
  nowUtc: string;
  sessionsUtc: string[];
  reflectionHour: number;
  morningHour: number;
  startAfterDays?: number;
  cadenceDays?: number;
  maxPerDay?: number;
  /**
   * IANA zone the reflection/morning hours are expressed in. Defaults to the
   * device zone, which is also what the app reports to the backend, so the
   * schedule shown here matches when the push actually arrives.
   */
  timeZone?: string;
  /**
   * Session length in minutes, keyed by the session's `startsAtUtc` string.
   *
   * Keyed rather than positional because the starts are sorted below, which
   * would break a parallel array. Missing entries mean "unknown", and a
   * reminder is then only held back until the session has started.
   */
  sessionDurationsMin?: Record<string, number>;
}

const REASON_PRIORITY: Record<Reason, number> = {
    [Reason.PreSession]: 0,
    [Reason.PostSession]: 1,
    [Reason.PostSleep]: 2,
    [Reason.MidSession]: 3,
};

/* ---------- Date helpers ---------- */

function floorToMinute(d: Date): Date {
    return new Date(Math.floor(d.getTime() / 60_000) * 60_000);
}

function addMs(d: Date, ms: number): Date {
    return new Date(d.getTime() + ms);
}

function parseUtcToMinute(iso: string): Date | null {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return floorToMinute(d);
}

/* ---------- Gap scheduling ---------- */

interface ReminderDraft {
  at: Date;
  reason: Reason;
  gapIndex: number;
}

interface GapWindow {
  index: number;
  start: Date;
  /** When the session at `start` finishes; the earliest a reminder may fire. */
  sessionEnd: Date;
  end: Date;
  days: number;
}

function createGapWindow(
    index: number,
    startIso: string,
    endIso: string,
    timeZone: string,
    startDurationMin = 0,
): GapWindow | null {
    const start = parseUtcToMinute(startIso);
    const end = parseUtcToMinute(endIso);
    if (!start || !end || end.getTime() <= start.getTime()) return null;

    const duration =
    Number.isFinite(startDurationMin) && startDurationMin > 0 ? startDurationMin : 0;

    return {
        index,
        start,
        sessionEnd: addMs(start, duration * 60_000),
        end,
        days: calendarDaysBetweenInZone(start, end, timeZone),
    };
}

/**
 * Whether `candidate` genuinely falls inside the usable part of the gap.
 *
 * Out-of-range candidates are rejected rather than dragged to the nearest edge.
 * Moving them is what produced reminders whose time contradicted their own
 * wording. Pulled forward, a 21:00 session made "20:00 on the session day"
 * earlier than the session itself and the reminder landed one minute into it.
 * Pushed back, a second session later the same day dragged the evening reminder
 * to one minute before that session.
 */
function fitWithinGap(candidate: Date, gap: GapWindow): Date | null {
    const earliest = new Date(
        Math.max(addMs(gap.start, 60_000).getTime(), gap.sessionEnd.getTime()),
    );
    const latest = addMs(gap.end, -60_000);
    if (earliest.getTime() > latest.getTime()) return null;

    if (candidate.getTime() < earliest.getTime()) return null;
    if (candidate.getTime() > latest.getTime()) return null;

    return floorToMinute(candidate);
}

function buildDraft(
    desired: Date,
    reason: Reason,
    gap: GapWindow,
    now: Date,
): ReminderDraft | null {
    const fitted = fitWithinGap(desired, gap);
    if (!fitted) return null;
    if (fitted.getTime() <= now.getTime()) return null;
    if (fitted.getTime() >= gap.end.getTime()) return null;
    return { at: fitted, reason, gapIndex: gap.index };
}

function scheduleForGap(
    gap: GapWindow,
    now: Date,
    reflectionHour: number,
    morningHour: number,
    startAfterDays: number,
    cadenceDays: number,
    timeZone: string,
): ReminderDraft[] {
    if (gap.end.getTime() <= now.getTime()) return [];

    const drafts: ReminderDraft[] = [];

    const postSession = buildDraft(
        setHourInZone(gap.start, reflectionHour, timeZone),
        Reason.PostSession,
        gap,
        now,
    );
    if (postSession) drafts.push(postSession);

    const postSleep = buildDraft(
        setHourInZone(addDaysInZone(gap.start, 1, timeZone), morningHour, timeZone),
        Reason.PostSleep,
        gap,
        now,
    );
    if (postSleep) drafts.push(postSleep);

    if (gap.days > startAfterDays) {
        const anchorBase = startOfDayInZone(gap.start, timeZone);
        for (let dayOffset = startAfterDays; dayOffset < gap.days; dayOffset += cadenceDays) {
            const anchor = addDaysInZone(anchorBase, dayOffset, timeZone);
            const mid = buildDraft(
                setHourInZone(anchor, reflectionHour, timeZone),
                Reason.MidSession,
                gap,
                now,
            );
            if (mid) drafts.push(mid);
        }
    }

    if (gap.days >= 1) {
        const preSession = buildDraft(
            setHourInZone(addDaysInZone(gap.end, -1, timeZone), reflectionHour, timeZone),
            Reason.PreSession,
            gap,
            now,
        );
        if (preSession) drafts.push(preSession);
    }

    return drafts;
}

/* ---------- Public API ---------- */

export function scheduleNeuroplasticityReminders(params: ScheduleParams): Reminder[] {
    const {
        nowUtc,
        sessionsUtc,
        reflectionHour,
        morningHour,
        startAfterDays = 3,
        cadenceDays = 4,
        maxPerDay = 1,
        timeZone,
        sessionDurationsMin,
    } = params;

    if (!sessionsUtc || sessionsUtc.length < 2) return [];

    const zone = resolveTimeZone(timeZone);

    const now = parseUtcToMinute(nowUtc);
    if (!now) return [];

    const sorted = [...sessionsUtc].sort();
    const gaps: GapWindow[] = [];
    for (let index = 0; index < sorted.length - 1; index += 1) {
        const gap = createGapWindow(
            index,
            sorted[index],
            sorted[index + 1],
            zone,
            sessionDurationsMin?.[sorted[index]] ?? 0,
        );
        if (gap) gaps.push(gap);
    }

    if (!gaps.length) return [];

    const drafts = gaps.flatMap((gap) =>
        scheduleForGap(gap, now, reflectionHour, morningHour, startAfterDays, cadenceDays, zone),
    );

    if (!drafts.length) return [];

    // Group by the user's local calendar day and enforce maxPerDay
    const byDay = new Map<number, ReminderDraft[]>();
    for (const draft of drafts) {
        const key = startOfDayInZone(draft.at, zone).getTime();
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key)!.push(draft);
    }

    const trimmed: ReminderDraft[] = [];
    for (const dayDrafts of byDay.values()) {
        dayDrafts.sort((a, b) => {
            const priority = REASON_PRIORITY[a.reason] - REASON_PRIORITY[b.reason];
            return priority !== 0 ? priority : a.at.getTime() - b.at.getTime();
        });
        trimmed.push(...dayDrafts.slice(0, maxPerDay));
    }

    trimmed.sort((a, b) => a.at.getTime() - b.at.getTime());

    return trimmed
        .filter((d) => d.at.getTime() > now.getTime())
        .map((d) => ({
            atUtc: d.at.toISOString(),
            reason: d.reason,
            gapIndex: d.gapIndex,
            localDate: localDateKeyInZone(d.at, zone),
        }));
}
