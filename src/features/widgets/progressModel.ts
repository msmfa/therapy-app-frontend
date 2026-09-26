import type { CalendarSnapshot } from '../../api/therapy';
import { Reason } from '../reminders/types';
import { occurrenceWindows } from '../reviews/reviewAttribution';
import { isOccurrenceAnswered } from '../reviews/reviewProgress';
import type { ReviewOccurrence } from '../reviews/reviewSchedule';
import type { NoteReview } from '../reviews/reviewStore';
import { addDaysInZone, calendarDaysBetweenInZone, localDateKeyInZone, startOfDayInZone } from '../../utils/timeZone';

export type ProgressSlot = {
    date: string;
    opens: number;
    closes: number;
    completed: boolean;
};
export type WidgetDisplay = {
    days: Array<{ id: number; label: string; complete: boolean; today: boolean }>;
    streak: number;
    hasSchedule: boolean;
    streakLabel: string;
    emptyTitle: string;
    emptyMessage: string;
    url: string;
};
export type ProgressTimeline = {
    version: 1;
    entries: Array<{ date: number; progress: WidgetDisplay }>;
};

// Read the materialised server plan: never turn delivered pushes into ticks.
// Reconstruct only the review identity, using the same fields as reviewSchedule.
export function progressSlots(calendar: CalendarSnapshot, reviews: NoteReview[]): ProgressSlot[] {
    const sessions = [...calendar.sessions].sort((a, b) => Date.parse(a.startsAtUtc) - Date.parse(b.startsAtUtc));
    const groups = new Map<string, ReviewOccurrence[]>();
    const bounds = new Map<string, [number, number] | null>();
    for (const reminder of calendar.reminders) {
        if (reminder.kind !== 'review_note' || !reminder.reason) continue;
        const index = sessions.findIndex((session) => session._id === reminder.sessionId);
        const opening = sessions[index];
        const closing = sessions.find((session) => session._id === reminder.nextSessionId) ?? sessions[index + 1];
        const key = `${reminder.sessionId}:${reminder.nextSessionId ?? closing?._id ?? ''}`;
        const slot = reminder.reason === Reason.MidSession && opening
            ? calendarDaysBetweenInZone(new Date(opening.startsAtUtc), new Date(reminder.dueAtUtc), calendar.timeZone)
            : 0;
        const occurrenceId = opening && closing
            ? JSON.stringify(['review-v1', opening._id, closing._id, reminder.reason, slot]) : undefined;
        const occurrence: ReviewOccurrence = {
            atUtc: reminder.dueAtUtc, localDate: reminder.localDate,
            reason: reminder.reason, gapIndex: index >= 0 ? index : reminder.gapIndex ?? 0,
            occurrenceId,
        };
        groups.set(key, [...(groups.get(key) ?? []), occurrence]);
        bounds.set(key, opening && closing ? [Date.parse(opening.startsAtUtc), Date.parse(closing.startsAtUtc)] : null);
    }
    return [...groups].flatMap(([key, occurrences]) => occurrenceWindows(occurrences).map((window) => ({
        date: window.occurrence.localDate,
        opens: window.atMs,
        closes: window.closesAtMs,
        completed: reviews.some((review) => isOccurrenceAnswered(window.occurrence, review, bounds.get(key) ?? null)),
    }))).sort((a, b) => a.opens - b.opens);
}

export function scheduledDayStreak(slots: ProgressSlot[], now: number): number {
    const days = new Map<string, ProgressSlot[]>();
    slots.forEach((slot) => days.set(slot.date, [...(days.get(slot.date) ?? []), slot]));
    let streak = 0;
    for (const [, day] of [...days].sort(([a], [b]) => a.localeCompare(b))) {
        // One credit per scheduled date; all its scheduled slots must be answered.
        if (day.every((slot) => slot.completed)) streak += 1;
        else if (day.some((slot) => !slot.completed && slot.closes <= now)) streak = 0;
        // An open or future window preserves the earned streak.
    }
    return streak;
}

const copy: Record<string, [string, string, string]> = {
    en: ['day streak', 'Your next step', 'Open Plastic Brains to see your check-ins.'],
    de: ['Tage in Folge', 'Dein nächster Schritt', 'Öffne Plastic Brains für deine Check-ins.'],
    es: ['días seguidos', 'Tu próximo paso', 'Abre Plastic Brains para ver tus registros.'],
    fr: ['jours de suite', 'Ton prochain petit pas', 'Ouvre Plastic Brains pour voir tes bilans.'],
};

export function widgetDisplay(slots: ProgressSlot[], at: Date, zone: string, language = 'en'): WidgetDisplay {
    const now = at.getTime();
    const today = localDateKeyInZone(at, zone);
    const open = slots.find((slot) => !slot.completed && slot.opens <= now && slot.closes > now);
    // Keep Sunday's open check-in visible after midnight on Monday.
    const anchor = open?.date ?? today;
    const date = new Date(`${anchor}T12:00:00Z`);
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
    const from = monday.toISOString().slice(0, 10);
    const to = sunday.toISOString().slice(0, 10);
    const visible = [...new Set(slots.filter((slot) => slot.date >= from && slot.date <= to).map((slot) => slot.date))].sort();
    const [streakLabel, defaultTitle, emptyMessage] = copy[language.split('-')[0]] ?? copy.en;
    const weekEmpty: Record<string, string> = { en: 'No check-ins this week', de: 'Diese Woche keine Check-ins', es: 'Sin registros esta semana', fr: 'Aucun bilan cette semaine' };
    const emptyTitle = slots.length > 0 && visible.length === 0 ? (weekEmpty[language.split('-')[0]] ?? weekEmpty.en) : defaultTitle;
    const days = visible.map((key, id) => ({
        id,
        label: new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`)),
        complete: slots.filter((slot) => slot.date === key).every((slot) => slot.completed),
        today: key === today || key === open?.date,
    }));
    return { days, streak: scheduledDayStreak(slots, now), hasSchedule: slots.length > 0,
        streakLabel, emptyTitle, emptyMessage, url: 'therapyapp:///(tabs)/notes' };
}

export function buildProgressTimeline(slots: ProgressSlot[], now: Date, zone: string, language = 'en'): ProgressTimeline {
    const end = addDaysInZone(now, 35, zone).getTime();
    const times = new Set<number>([now.getTime()]);
    for (const slot of slots) {
        for (const boundary of [slot.opens, slot.closes]) if (boundary > now.getTime() && boundary <= end) times.add(boundary);
    }
    for (let day = 1; day <= 35; day++) times.add(addDaysInZone(startOfDayInZone(now, zone), day, zone).getTime());
    return { version: 1, entries: [...times].sort((a, b) => a - b).map((date) => ({
        date: date / 1000, progress: widgetDisplay(slots, new Date(date), zone, language),
    })) };
}
