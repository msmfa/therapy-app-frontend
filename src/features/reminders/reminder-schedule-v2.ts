import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

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
// • future-facing (never before “now” inside the gap)
// • clamped inside the gap between two sessions
// • limited to maxPerDay with priority pre_session > post_session > post_sleep > mid_session

export enum Reason {
    PostSession = 'post_session',
    PostSleep = 'post_sleep',
    MidSession = 'mid_session',
    PreSession = 'pre_session',
}

export interface Reminder {
  atUtc: string;
  /**
   * The calendar day this reminder belongs to in the user's zone, as
   * YYYY-MM-DD. 20:00 in Los Angeles is 04:00 UTC the next day, so deriving a
   * day key from `atUtc` puts calendar markers on the wrong date; consumers
   * should key off this instead.
   */
  localDate: string;
  reason: Reason;
  gapIndex: number;
}

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
   * schedule shown here matches when the push actually arrives. Computing in
   * UTC put the "morning" reminder at 23:00 the previous night for anyone in
   * the Americas.
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

interface ReminderDraft {
  at: Dayjs;
  reason: Reason;
  gapIndex: number;
}

interface GapWindow {
  index: number;
  start: Dayjs;
  /** When the session at `start` finishes; the earliest a reminder may fire. */
  sessionEnd: Dayjs;
  end: Dayjs;
  days: number;
}

interface GapContext {
  now: Dayjs;
  zone: string;
  reflectionHour: number;
  morningHour: number;
  startAfterDays: number;
  cadenceDays: number;
}

/* ---------- Day helpers ---------- */

const UTC_ZONE = 'UTC';

function isValidZone(zone: string | undefined): zone is string {
    if (!zone) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone });
        return true;
    } catch {
        return false;
    }
}

function resolveZone(requested?: string): string {
    if (isValidZone(requested)) return requested;

    try {
        const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (isValidZone(device)) return device;
    } catch {
        // fall through
    }

    return UTC_ZONE;
}

/**
 * Parsed into the target zone, so every downstream calendar operation
 * (`hour()`, `startOf('day')`, `add(1, 'day')`) is evaluated against the
 * user's local clock rather than UTC. The emitted `atUtc` is unaffected.
 */
function parseIsoToMinute(iso: string, zone: string): Dayjs | null {
    const parsed = dayjs.utc(iso).tz(zone).second(0).millisecond(0);
    return parsed.isValid() ? parsed : null;
}

/**
 * The local calendar date of a correctly-zoned instant, as YYYY-MM-DD.
 */
function localDateKey(source: Dayjs): string {
    return source.format('YYYY-MM-DD');
}

/**
 * `dayOffset` calendar days after `source`, at `hour`:00 local time.
 *
 * The day arithmetic is done on the bare calendar (in UTC space, where every
 * day is 24h) and the result is then *reinterpreted* in the zone. Doing it
 * with `source.add(n, 'day').hour(h)` is wrong across a DST transition: a
 * dayjs .tz() instance keeps the offset it was constructed with, so adding a
 * day to a PST instant and setting hour 7 produces 07:00 -08:00, which is
 * 08:00 PDT — an hour late — and every later reminder in the gap inherits the
 * drift. Rebuilding via dayjs.tz resolves the offset for the target date.
 */
function atLocalHour(source: Dayjs, dayOffset: number, hour: number, zone: string): Dayjs {
    const shifted = new Date(
        Date.UTC(source.year(), source.month(), source.date() + dayOffset),
    );

    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
    const d = String(shifted.getUTCDate()).padStart(2, '0');
    const h = String(hour).padStart(2, '0');

    return dayjs.tz(`${y}-${m}-${d}T${h}:00:00`, zone);
}

/**
 * Whole calendar days between two instants, counted on the local calendar.
 * Diffing local-midnight instants directly is off by one across a DST week,
 * because one of those "days" is 23 or 25 hours long.
 */
function countLocalCalendarDays(start: Dayjs, end: Dayjs): number {
    const startDay = Date.UTC(start.year(), start.month(), start.date());
    const endDay = Date.UTC(end.year(), end.month(), end.date());
    return Math.max(0, Math.round((endDay - startDay) / 86_400_000));
}

/**
 * Places `candidate` inside the gap, or rejects it.
 *
 * A candidate falling *before* the window is dropped rather than pulled
 * forward. Pulling it forward is what used to put the evening reminder inside
 * the session it was reflecting on: a 21:00 session makes "20:00 on the session
 * day" earlier than the session itself, and the old clamp moved it to one
 * minute past the start, so the reminder landed while the user was still in the
 * room. There is no evening slot left in that case, and the next morning's
 * reminder already covers it.
 *
 * A candidate past the window is still clamped back, which only shortens the
 * wait before an already-scheduled next session.
 */
function fitTimestampWithinGapWindow(candidate: Dayjs, gap: GapWindow): Dayjs | null {
    const afterStart = gap.start.add(1, 'minute');
    const earliest = gap.sessionEnd.isAfter(afterStart) ? gap.sessionEnd : afterStart;
    const latest = gap.end.subtract(1, 'minute');
    if (earliest.isAfter(latest)) return null;

    if (candidate.isBefore(earliest)) return null;

    const fitted = candidate.isAfter(latest) ? latest : candidate;
    return fitted.second(0).millisecond(0);
}



/* ---------- Gap scheduling ---------- */

function buildReminderDraftWithinGap(desired: Dayjs, reason: Reason, gap: GapWindow, ctx: GapContext): ReminderDraft | null {
    const withinGap = fitTimestampWithinGapWindow(desired, gap);
    if (!withinGap) return null;
    if (!withinGap.isAfter(ctx.now)) return null;
    if (!withinGap.isBefore(gap.end)) return null;

    return {
        at: withinGap,
        reason,
        gapIndex: gap.index,
    };
}

function scheduleRemindersForGap(gap: GapWindow, ctx: GapContext): ReminderDraft[] {
    if (!gap.end.isAfter(ctx.now)) return [];

    const drafts: ReminderDraft[] = [];

    const postSession = buildReminderDraftWithinGap(atLocalHour(gap.start, 0, ctx.reflectionHour, ctx.zone), Reason.PostSession, gap, ctx);
    if (postSession) drafts.push(postSession);

    const postSleep = buildReminderDraftWithinGap(atLocalHour(gap.start, 1, ctx.morningHour, ctx.zone), Reason.PostSleep, gap, ctx);
    if (postSleep) drafts.push(postSleep);

    if (gap.days > ctx.startAfterDays) {
        for (let dayOffset = ctx.startAfterDays; dayOffset < gap.days; dayOffset += ctx.cadenceDays) {
            const midSession = buildReminderDraftWithinGap(atLocalHour(gap.start, dayOffset, ctx.reflectionHour, ctx.zone), Reason.MidSession, gap, ctx);
            if (midSession) drafts.push(midSession);
        }
    }

    if (gap.days >= 1) {
        const preSession = buildReminderDraftWithinGap(atLocalHour(gap.end, -1, ctx.reflectionHour, ctx.zone), Reason.PreSession, gap, ctx);
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

    const zone = resolveZone(timeZone);

    const now = parseIsoToMinute(nowUtc, zone);
    if (!now) return [];

    const sortedSessions = [...sessionsUtc].sort();
    const windows: GapWindow[] = [];

    for (let index = 0; index < sortedSessions.length - 1; index += 1) {
        const window = createGapWindowFromIsoSessions(
            index,
            sortedSessions[index],
            sortedSessions[index + 1],
            zone,
            sessionDurationsMin?.[sortedSessions[index]] ?? 0,
        );
        if (window) windows.push(window);
    }

    if (!windows.length) return [];

    const ctx: GapContext = {
        now,
        zone,
        reflectionHour,
        morningHour,
        startAfterDays,
        cadenceDays,
    };

    const drafts = windows.flatMap((gap) => scheduleRemindersForGap(gap, ctx));
    if (!drafts.length) return [];

    const remindersByDay = new Map<string, ReminderDraft[]>();

    for (const draft of drafts) {
        const key = localDateKey(draft.at);
        if (!remindersByDay.has(key)) remindersByDay.set(key, []);
    remindersByDay.get(key)!.push(draft);
    }

    const trimmedDrafts: ReminderDraft[] = [];

    for (const dayDrafts of remindersByDay.values()) {
        dayDrafts.sort((a, b) => {
            const priorityDiff = REASON_PRIORITY[a.reason] - REASON_PRIORITY[b.reason];
            if (priorityDiff !== 0) return priorityDiff;
            return a.at.valueOf() - b.at.valueOf();
        });
        trimmedDrafts.push(...dayDrafts.slice(0, maxPerDay));
    }

    trimmedDrafts.sort((a, b) => a.at.valueOf() - b.at.valueOf());

    return trimmedDrafts
        .filter((draft) => draft.at.isAfter(now))
        .map((draft) => ({
            atUtc: draft.at.toISOString(),
            localDate: localDateKey(draft.at),
            reason: draft.reason,
            gapIndex: draft.gapIndex,
        }));
}

/* ---------- Helpers ---------- */

function createGapWindowFromIsoSessions(
    index: number,
    startIso: string,
    endIso: string,
    zone: string,
    startDurationMin = 0,
): GapWindow | null {
    const start = parseIsoToMinute(startIso, zone);
    const end = parseIsoToMinute(endIso, zone);
    if (!start || !end || !end.isAfter(start)) return null;

    const duration = Number.isFinite(startDurationMin) && startDurationMin > 0 ? startDurationMin : 0;

    return {
        index,
        start,
        sessionEnd: start.add(duration, 'minute'),
        end,
        days: countLocalCalendarDays(start, end),
    };
}
