import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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
  reflectionHour: number;
  morningHour: number;
  startAfterDays: number;
  cadenceDays: number;
}

/* ---------- Day helpers ---------- */

function parseIsoUtcToMinute(iso: string): Dayjs | null {
    const parsed = dayjs.utc(iso).second(0).millisecond(0);
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
    } = params;

    if (!sessionsUtc || sessionsUtc.length < 2) return [];

    const now = parseIsoUtcToMinute(nowUtc);
    if (!now) return [];

    const sortedSessions = [...sessionsUtc].sort();
    const windows: GapWindow[] = [];

    for (let index = 0; index < sortedSessions.length - 1; index += 1) {
        const window = createGapWindowFromIsoSessions(index, sortedSessions[index], sortedSessions[index + 1]);
        if (window) windows.push(window);
    }

    if (!windows.length) return [];

    const ctx: GapContext = {
        now,
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

function createGapWindowFromIsoSessions(index: number, startIso: string, endIso: string): GapWindow | null {
    const start = parseIsoUtcToMinute(startIso);
    const end = parseIsoUtcToMinute(endIso);
    if (!start || !end || !end.isAfter(start)) return null;

    return {
        index,
        start,
        end,
        days: countCalendarDaysBetweenUtcMoments(start, end),
    };
}
