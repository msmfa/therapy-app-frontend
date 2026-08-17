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

function setToHourStart(source: Dayjs, hour: number): Dayjs {
    return source.hour(hour).minute(0).second(0).millisecond(0);
}

function clampTimestampWithinGapWindow(candidate: Dayjs, gap: GapWindow): Dayjs | null {
    const earliest = gap.start.add(1, 'minute');
    const latest = gap.end.subtract(1, 'minute');
    if (earliest.isAfter(latest)) return null;

    let clamped = candidate;
    if (candidate.isBefore(earliest)) clamped = earliest;
    else if (candidate.isAfter(latest)) clamped = latest;

    return clamped.second(0).millisecond(0);
}

function countCalendarDaysBetweenUtcMoments(start: Dayjs, end: Dayjs): number {
    const startDay = start.startOf('day');
    const endDay = end.startOf('day');
    return Math.max(0, endDay.diff(startDay, 'day'));
}

/* ---------- Gap scheduling ---------- */

function buildReminderDraftWithinGap(desired: Dayjs, reason: Reason, gap: GapWindow, ctx: GapContext): ReminderDraft | null {
    const withinGap = clampTimestampWithinGapWindow(desired, gap);
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

    const postSession = buildReminderDraftWithinGap(setToHourStart(gap.start, ctx.reflectionHour), Reason.PostSession, gap, ctx);
    if (postSession) drafts.push(postSession);

    const postSleep = buildReminderDraftWithinGap(setToHourStart(gap.start.add(1, 'day'), ctx.morningHour), Reason.PostSleep, gap, ctx);
    if (postSleep) drafts.push(postSleep);

    if (gap.days > ctx.startAfterDays) {
        const anchorBase = gap.start.startOf('day');
        for (let dayOffset = ctx.startAfterDays; dayOffset < gap.days; dayOffset += ctx.cadenceDays) {
            const anchor = anchorBase.add(dayOffset, 'day');
            const midSession = buildReminderDraftWithinGap(setToHourStart(anchor, ctx.reflectionHour), Reason.MidSession, gap, ctx);
            if (midSession) drafts.push(midSession);
        }
    }

    if (gap.days >= 1) {
        const preSession = buildReminderDraftWithinGap(setToHourStart(gap.end.subtract(1, 'day'), ctx.reflectionHour), Reason.PreSession, gap, ctx);
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
    } = params;

    if (!sessionsUtc || sessionsUtc.length < 2) return [];

    const zone = resolveZone(timeZone);

    const now = parseIsoToMinute(nowUtc, zone);
    if (!now) return [];

    const sortedSessions = [...sessionsUtc].sort();
    const windows: GapWindow[] = [];

    for (let index = 0; index < sortedSessions.length - 1; index += 1) {
        const window = createGapWindowFromIsoSessions(index, sortedSessions[index], sortedSessions[index + 1], zone);
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
        const key = draft.at.startOf('day').toISOString();
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
): GapWindow | null {
    const start = parseIsoToMinute(startIso, zone);
    const end = parseIsoToMinute(endIso, zone);
    if (!start || !end || !end.isAfter(start)) return null;

    return {
        index,
        start,
        end,
        days: countCalendarDaysBetweenUtcMoments(start, end),
    };
}
