/**
 * The calendar API module against a real backend.
 *
 * Skipped unless CALENDAR_BACKEND_URL names a running therapy-app-backend
 * (see ~/.plastic-brains-local). Nothing is mocked: the same helpers the app
 * calls register an account, book a weekly series, read the plan the server
 * materialised for it, edit the tail, end it, and get refused with a stale
 * revision. It is the contract between the two repos, exercised end to end.
 */
import { apiPatch, apiPost, ApiError, configureApiClient } from '../client';
import { createSession, deleteSession, getCalendar, updateSession, type CalendarSnapshot } from '../therapy';
import { getCalendarFetchWindow } from '../../features/calendar/calendarSelectors';

jest.unmock('../therapy');

const backendUrl = process.env.CALENDAR_BACKEND_URL;
const describeIfBackend = backendUrl ? describe : describe.skip;

const ZONE = 'Europe/London';
const hourIn = (iso: string, timeZone: string) =>
    Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(new Date(iso))) % 24;
const dayKeyIn = (iso: string, timeZone: string) => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
    return parts;
};

/** 17:00 London on the first Tuesday at least a week from now. */
const firstTuesdayAt17 = (): Date => {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 7);
    while (start.getUTCDay() !== 2) start.setUTCDate(start.getUTCDate() + 1);
    const key = dayKeyIn(start.toISOString(), ZONE);
    // 17:00 London is 16:00Z in summer and 17:00Z in winter; resolve by trial.
    for (const utcHour of [16, 17]) {
        const candidate = new Date(`${key}T${String(utcHour).padStart(2, '0')}:00:00.000Z`);
        if (hourIn(candidate.toISOString(), ZONE) === 17) return candidate;
    }
    throw new Error('could not place 17:00 London');
};

describeIfBackend('calendar API against the real backend', () => {
    let token = '';
    let snapshot: CalendarSnapshot;
    const window = getCalendarFetchWindow();

    beforeAll(async () => {
        configureApiClient({ baseUrl: backendUrl!, getToken: () => token || null, defaultTimeoutMs: 20_000 });
        const email = `calendar-e2e-${Date.now()}@example.com`;
        const registered = await apiPost<{ token: string }>('/api/auth/register', {
            email, password: 'Password123!', name: 'Calendar E2E',
        }, { auth: false });
        token = registered.token;
        await apiPatch('/api/users/me', {
            timeZone: ZONE, morningReminderMinutes: 450, eveningReminderMinutes: 1215,
        }, { parseJson: false });
        snapshot = await getCalendar(window.from, window.to);
    });

    it('starts empty, in the zone the profile holds', () => {
        expect(snapshot.sessions).toEqual([]);
        expect(snapshot.reminders).toEqual([]);
        expect(snapshot.timeZone).toBe(ZONE);
        expect(snapshot.eveningReminderMinutes).toBe(1215);
    });

    it('books a weekly series that the server materialises a year ahead, keeping 17:00 across the clock change', async () => {
        const first = firstTuesdayAt17();
        const result = await createSession({ startsAtUtc: first, durationMin: 50, repeat: 'weekly' }, snapshot.revision);
        expect(result.created).toBeGreaterThan(40);
        expect(result.series?.cadence).toBe('weekly');
        expect(result.revision).toBeGreaterThan(snapshot.revision);

        snapshot = await getCalendar(window.from, window.to);
        expect(snapshot.sessions.length).toBe(result.created);
        expect(snapshot.series).toHaveLength(1);
        for (const session of snapshot.sessions) {
            expect(session.seriesId).toBe(result.series?.id);
            expect(hourIn(session.startsAtUtc, ZONE)).toBe(17);
            expect(new Date(session.startsAtUtc).getUTCDay()).toBe(2);
        }
        // The instants differ either side of the DST change while the wall clock does not.
        const utcHours = new Set(snapshot.sessions.map((s) => new Date(s.startsAtUtc).getUTCHours()));
        expect(utcHours.size).toBe(2);
    });

    it('returns the reminder plan the cron will send, one row per push', () => {
        const [first, second] = snapshot.sessions;
        const byKind = (kind: string) => snapshot.reminders.filter((r) => r.kind === kind);
        expect(byKind('log_note').length).toBe(snapshot.sessions.length);
        expect(byKind('review_note').length).toBeGreaterThan(snapshot.sessions.length);
        expect(snapshot.reminders.every((r) => r.status === 'pending')).toBe(true);

        // Write-up prompt ten minutes after the first session ends.
        const logNote = byKind('log_note').find((r) => r.sessionId === first._id);
        expect(logNote?.dueAtUtc).toBe(new Date(new Date(first.startsAtUtc).getTime() + 60 * 60_000).toISOString());

        // Evening review on the day of the first session, at the chosen 20:15.
        const firstDay = dayKeyIn(first.startsAtUtc, ZONE);
        const evening = snapshot.reminders.find((r) => r.kind === 'review_note' && r.localDate === firstDay);
        expect(evening?.reason).toBe('post_session');
        expect(evening?.sessionId).toBe(first._id);
        expect(evening?.nextSessionId).toBe(second._id);
        expect(hourIn(evening!.dueAtUtc, ZONE)).toBe(20);

        // The evening before the second session is the pre-session review.
        const eveBefore = dayKeyIn(new Date(new Date(second.startsAtUtc).getTime() - 24 * 60 * 60_000).toISOString(), ZONE);
        const pre = snapshot.reminders.find((r) => r.kind === 'review_note' && r.localDate === eveBefore);
        expect(pre?.reason).toBe('pre_session');

        // Sorted, and never more than one review per local day.
        const due = snapshot.reminders.map((r) => Date.parse(r.dueAtUtc));
        expect([...due].sort((a, b) => a - b)).toEqual(due);
        const reviewDays = byKind('review_note').map((r) => r.localDate);
        expect(new Set(reviewDays).size).toBe(reviewDays.length);
    });

    it('moves every later session when the edit applies to all future sessions', async () => {
        const [first] = snapshot.sessions;
        const moved = new Date(new Date(first.startsAtUtc).getTime() + 60 * 60_000);
        await updateSession(first._id, { startsAtUtc: moved, scope: 'future' }, snapshot.revision);

        snapshot = await getCalendar(window.from, window.to);
        for (const session of snapshot.sessions) {
            expect(hourIn(session.startsAtUtc, ZONE)).toBe(18);
        }
        const series = snapshot.series.find((s) => !s.endsAtUtc);
        expect(series?.startsAtUtc).toBe(moved.toISOString());
        // The plan followed: the write-up prompt moved with the session.
        const logNote = snapshot.reminders.find((r) => r.kind === 'log_note' && r.sessionId === snapshot.sessions[0]._id);
        expect(logNote?.dueAtUtc).toBe(new Date(moved.getTime() + 60 * 60_000).toISOString());
    });

    it('marks a single-session edit as an exception the series leaves alone', async () => {
        const second = snapshot.sessions[1];
        const nudged = new Date(new Date(second.startsAtUtc).getTime() + 30 * 60_000);
        await updateSession(second._id, { startsAtUtc: nudged, scope: 'this' }, snapshot.revision);

        snapshot = await getCalendar(window.from, window.to);
        const edited = snapshot.sessions.find((s) => s._id === second._id);
        expect(edited?.exception).toBe(true);
        expect(edited?.startsAtUtc).toBe(nudged.toISOString());
        expect(snapshot.sessions.filter((s) => s.exception)).toHaveLength(1);
    });

    it('ends the series from a session onward and drops the reminders with it', async () => {
        const third = snapshot.sessions[2];
        const result = await deleteSession(third._id, 'future', snapshot.revision);
        expect(result.deleted).toBeGreaterThan(30);

        snapshot = await getCalendar(window.from, window.to);
        expect(snapshot.sessions).toHaveLength(2);
        expect(snapshot.series.every((s) => s.endsAtUtc)).toBe(true);
        const lastSessionMs = Math.max(...snapshot.sessions.map((s) => Date.parse(s.startsAtUtc)));
        // Nothing is planned after the last remaining session's own follow-ups.
        expect(snapshot.reminders.every((r) => Date.parse(r.dueAtUtc) <= lastSessionMs + 2 * 24 * 60 * 60_000)).toBe(true);
    });

    it('refuses an edit made against a revision another device has moved past', async () => {
        await expect(
            createSession({ startsAtUtc: new Date(Date.now() + 30 * 24 * 60 * 60_000) }, snapshot.revision - 1),
        ).rejects.toMatchObject({ status: 412, code: 'calendar_changed' });
        expect(ApiError).toBeDefined();
    });
});
