import { buildProgressTimeline, progressSlots, scheduledDayStreak, widgetDisplay, type ProgressSlot } from '../progressModel';
import { occurrenceWindows } from '../../reviews/reviewAttribution';
import { occurrencesForGap } from '../../reviews/reviewSchedule';
import type { CalendarSnapshot } from '../../../api/therapy';
import type { NoteReview } from '../../reviews/reviewStore';

const sessions = [
    { _id: 'a', startsAtUtc: '2026-09-21T14:00:00Z' },
    { _id: 'b', startsAtUtc: '2026-09-28T14:00:00Z' },
];
const occurrences = occurrencesForGap(0, {
    sessionsUtc: sessions.map(s => s.startsAtUtc),
    sessionIdsByStart: Object.fromEntries(sessions.map(s => [s.startsAtUtc, s._id])), timeZone: 'UTC',
});
const calendar: CalendarSnapshot = {
    revision: 1, timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200,
    sessions, series: [], reminders: occurrences.map((o, i) => ({
        id: `r${i}`, kind: 'review_note', reason: o.reason, dueAtUtc: o.atUtc,
        localDate: o.localDate, sessionId: 'a', nextSessionId: 'b', status: 'sent', gapIndex: 0,
    })),
};
const review = (index: number): NoteReview => ({
    noteId: 'private-note', localDate: occurrences[index].localDate, reviewedAt: Date.parse(occurrences[index].atUtc) + 1000,
    reason: occurrences[index].reason, occurrenceAtUtc: occurrences[index].atUtc,
    occurrenceId: occurrences[index].occurrenceId, gapIndex: 0,
});
const at = (value: string) => Date.parse(value);
const slot = (date: string, completed: boolean): ProgressSlot => ({
    date, completed, opens: at(`${date}T20:00:00Z`), closes: at(`${date}T20:00:00Z`) + 8 * 3600000,
});

describe('real widget progress', () => {
    it('uses exactly the same window boundaries as review attribution', () => {
        expect(progressSlots(calendar, []).map(s => [s.opens, s.closes])).toEqual(
            occurrenceWindows(occurrences).map(w => [w.atMs, w.closesAtMs]));
    });
    it('matches persisted stable review identities, not delivery status', () => {
        expect(progressSlots(calendar, [review(0)]).map(s => s.completed)).toEqual([true, false, false, false]);
        expect(progressSlots(calendar, []).every(s => !s.completed)).toBe(true);
    });
    it('preserves an identified tick when a reminder time changes', () => {
        const changed = { ...calendar, reminders: calendar.reminders.map((r, i) => i === 0 ? { ...r, dueAtUtc: r.dueAtUtc.replace('20:00', '21:00') } : r) };
        expect(progressSlots(changed, [review(0)])[0].completed).toBe(true);
    });
    it('does not count log-note pushes as scheduled review days', () => {
        const changed: CalendarSnapshot = { ...calendar, reminders: [{ ...calendar.reminders[0], kind: 'log_note' }] };
        expect(progressSlots(changed, [])).toEqual([]);
    });
    it('keeps the streak through unscheduled days and an open cross-midnight window', () => {
        const slots = [slot('2026-09-21', true), slot('2026-09-23', true), slot('2026-09-26', false)];
        expect(scheduledDayStreak(slots, at('2026-09-25T12:00:00Z'))).toBe(2);
        expect(scheduledDayStreak(slots, at('2026-09-27T03:59:59Z'))).toBe(2);
        expect(scheduledDayStreak(slots, at('2026-09-27T04:00:00Z'))).toBe(0);
    });
    it('restarts after a missed window and counts one credit per date', () => {
        const slots = [slot('2026-09-21', true), slot('2026-09-23', false), slot('2026-09-26', true), slot('2026-09-26', true)];
        expect(scheduledDayStreak(slots, at('2026-09-27T12:00:00Z'))).toBe(1);
    });
    it('undoing a tick respects whether its original window is still open', () => {
        const slots = [slot('2026-09-21', true), slot('2026-09-23', true)];
        expect(scheduledDayStreak(slots, at('2026-09-24T01:00:00Z'))).toBe(2);
        slots[1].completed = false;
        expect(scheduledDayStreak(slots, at('2026-09-24T01:00:00Z'))).toBe(1);
        expect(scheduledDayStreak(slots, at('2026-09-24T04:00:00Z'))).toBe(0);
    });
    it('shows only scheduled dates and keeps an open Sunday visible on Monday', () => {
        const slots = [slot('2026-09-21', true), slot('2026-09-27', false)];
        const display = widgetDisplay(slots, new Date('2026-09-28T01:00:00Z'), 'UTC');
        expect(display.days.map(d => d.label)).toEqual(['Mon', 'Sun']);
        expect(display.days[1].today).toBe(true);
        expect(display.streak).toBe(1);
    });
    it('builds timeline entries at window closure and local midnights across DST', () => {
        const slots = [slot('2026-10-24', false)];
        const timeline = buildProgressTimeline(slots, new Date('2026-10-24T22:00:00Z'), 'Europe/London');
        const dates = timeline.entries.map(e => new Date(e.date * 1000).toISOString());
        expect(dates).toContain('2026-10-24T23:00:00.000Z');
        expect(dates).toContain('2026-10-26T00:00:00.000Z');
        expect(dates).toContain('2026-10-25T04:00:00.000Z');
    });
    it('shares only display metadata and uses the review screen deep link', () => {
        const payload = buildProgressTimeline(progressSlots(calendar, [review(0)]), new Date('2026-09-21T21:00:00Z'), 'UTC');
        expect(JSON.stringify(payload)).not.toContain('private-note');
        expect(payload.entries[0].progress.url).toBe('therapyapp:///(tabs)/notes');
        expect(widgetDisplay([], new Date(), 'UTC').hasSchedule).toBe(false);
    });
});
