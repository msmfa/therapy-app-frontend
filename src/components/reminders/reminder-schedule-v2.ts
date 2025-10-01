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

export type Reason = 'post_session' | 'post_sleep' | 'mid_session' | 'pre_session';

export interface Reminder {
  atUtc: string;
  reason: Reason;
  gapIndex: number;
}

export interface PostSessionNoteReminder {
  sessionId?: string;
  sessionStartsAtUtc: string;
  remindAtUtc: string;
}

interface RawSessionLike {
  _id?: string;
  id?: string;
  startsAtUtc?: string;
  durationMin?: number | null;
}

export interface PostSessionNoteParams {
  sessions: RawSessionLike[];
  nowUtc: string;
  minutesAfterSession: number;
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
    pre_session: 0,
    post_session: 1,
    post_sleep: 2,
    mid_session: 3,
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

function toUtcMinute(iso: string): Dayjs | null {
    const parsed = dayjs.utc(iso).second(0).millisecond(0);
    return parsed.isValid() ? parsed : null;
}

function withHour(source: Dayjs, hour: number): Dayjs {
    return source.hour(hour).minute(0).second(0).millisecond(0);
}

function clampWithinGap(candidate: Dayjs, gap: GapWindow): Dayjs | null {
    const earliest = gap.start.add(1, 'minute');
    const latest = gap.end.subtract(1, 'minute');
    if (earliest.isAfter(latest)) return null;

    let clamped = candidate;
    if (candidate.isBefore(earliest)) clamped = earliest;
    else if (candidate.isAfter(latest)) clamped = latest;

    return clamped.second(0).millisecond(0);
}

function countCalendarDaysBetween(start: Dayjs, end: Dayjs): number {
    const startDay = start.startOf('day');
    const endDay = end.startOf('day');
    return Math.max(0, endDay.diff(startDay, 'day'));
}

/* ---------- Gap scheduling ---------- */

function buildReminder(desired: Dayjs, reason: Reason, gap: GapWindow, ctx: GapContext): ReminderDraft | null {
    const withinGap = clampWithinGap(desired, gap);
    if (!withinGap) return null;
    if (!withinGap.isAfter(ctx.now)) return null;
    if (!withinGap.isBefore(gap.end)) return null;

    return {
        at: withinGap,
        reason,
        gapIndex: gap.index,
    };
}

function scheduleGap(gap: GapWindow, ctx: GapContext): ReminderDraft[] {
    if (!gap.end.isAfter(ctx.now)) return [];

    const drafts: ReminderDraft[] = [];

    const postSession = buildReminder(withHour(gap.start, ctx.reflectionHour), 'post_session', gap, ctx);
    if (postSession) drafts.push(postSession);

    const postSleep = buildReminder(withHour(gap.start.add(1, 'day'), ctx.morningHour), 'post_sleep', gap, ctx);
    if (postSleep) drafts.push(postSleep);

    if (gap.days > ctx.startAfterDays) {
        const anchorBase = gap.start.startOf('day');
        for (let dayOffset = ctx.startAfterDays; dayOffset < gap.days; dayOffset += ctx.cadenceDays) {
            const anchor = anchorBase.add(dayOffset, 'day');
            const midSession = buildReminder(withHour(anchor, ctx.reflectionHour), 'mid_session', gap, ctx);
            if (midSession) drafts.push(midSession);
        }
    }

    if (gap.days >= 1) {
        const preSession = buildReminder(withHour(gap.end.subtract(1, 'day'), ctx.reflectionHour), 'pre_session', gap, ctx);
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

    const now = toUtcMinute(nowUtc);
    if (!now) return [];

    const sortedSessions = [...sessionsUtc].sort();
    const windows: GapWindow[] = [];

    for (let index = 0; index < sortedSessions.length - 1; index += 1) {
        const window = createGapWindow(index, sortedSessions[index], sortedSessions[index + 1]);
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

    const drafts = windows.flatMap((gap) => scheduleGap(gap, ctx));
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

export function getPostSessionNoteReminders(params: PostSessionNoteParams): PostSessionNoteReminder[] {
    const { sessions, nowUtc, minutesAfterSession } = params;
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    if (minutesAfterSession < 0) return [];

    const now = toUtcMinute(nowUtc);
    if (!now) return [];

    const reminders: PostSessionNoteReminder[] = [];

    for (const session of sessions) {
        const startsAtUtc = session?.startsAtUtc;
        if (!startsAtUtc) continue;

        const start = toUtcMinute(startsAtUtc);
        if (!start) continue;

        const duration = typeof session?.durationMin === 'number' && session.durationMin > 0
            ? session.durationMin
            : 0;

        const remindAt = start
            .add(duration + minutesAfterSession, 'minute')
            .second(0)
            .millisecond(0);

        if (!remindAt.isAfter(now)) continue;

        const sessionId = session?._id ?? session?.id;

        reminders.push({
            sessionId: sessionId ?? undefined,
            sessionStartsAtUtc: start.toISOString(),
            remindAtUtc: remindAt.toISOString(),
        });
    }

    reminders.sort((a, b) => dayjs(a.remindAtUtc).valueOf() - dayjs(b.remindAtUtc).valueOf());

    return reminders;
}

/* ---------- Helpers ---------- */

function createGapWindow(index: number, startIso: string, endIso: string): GapWindow | null {
    const start = toUtcMinute(startIso);
    const end = toUtcMinute(endIso);
    if (!start || !end || !end.isAfter(start)) return null;

    return {
        index,
        start,
        end,
        days: countCalendarDaysBetween(start, end),
    };
}

/* ---------- Lightweight examples ---------- */

export function exampleWeekly() {
    return scheduleNeuroplasticityReminders({
        nowUtc: '2025-09-28T10:00:00Z',
        sessionsUtc: ['2025-09-29T09:00:00Z', '2025-10-06T09:00:00Z'],
        reflectionHour: 20,
        morningHour: 9,
    });
}

export function exampleTwoPerWeek() {
    return scheduleNeuroplasticityReminders({
        nowUtc: '2025-09-28T10:00:00Z',
        sessionsUtc: ['2025-09-29T09:00:00Z', '2025-10-01T09:00:00Z', '2025-10-06T09:00:00Z'],
        reflectionHour: 20,
        morningHour: 9,
    });
}

export function exampleBiweekly() {
    return scheduleNeuroplasticityReminders({
        nowUtc: '2025-09-28T10:00:00Z',
        sessionsUtc: ['2025-09-29T09:00:00Z', '2025-10-13T09:00:00Z'],
        reflectionHour: 20,
        morningHour: 9,
        startAfterDays: 3,
        cadenceDays: 4,
    });
}
