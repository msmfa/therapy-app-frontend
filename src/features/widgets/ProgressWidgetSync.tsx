import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getCalendar, type CalendarSnapshot } from '../../api/therapy';
import { useAuth } from '../../context/auth/AuthContext';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import { getCalendarFetchWindow } from '../calendar/calendarSelectors';
import { listReviewsForUser } from '../reviews/reviewStore';
import { subscribeProgressChanges } from './progressEvents';
import { buildProgressTimeline, progressSlots } from './progressModel';
import { hasProgressWidget, setProgressOwner, writeProgressWidget } from './nativeProgress';

// Retained only in this mounted account's closure. Older history is fetched in
// bounded chunks, because the main calendar only retains the previous 90 days.
export function ProgressWidgetSync() {
    const { user, isAuthenticated, hydrated: authReady } = useAuth();
    const { scheduleSessions, reminders, reminderScheduleSettings: settings, revision, hydrated } = useTherapySessions();
    const { i18n } = useTranslation();
    const owner = isAuthenticated ? user?.id ?? null : null;
    useEffect(() => {
        if (authReady && hasProgressWidget()) setProgressOwner(owner);
    }, [owner, authReady]);
    useEffect(() => {
        if (!hasProgressWidget() || !authReady || !owner || !hydrated || !settings) return;
        let disposed = false;
        let sequence = 0;
        let history: CalendarSnapshot[] | null = null;
        let historyFloor = Infinity;
        const sync = async () => {
            const request = ++sequence;
            const current = () => !disposed && request === sequence;
            try {
                const reviews = await listReviewsForUser(owner);
                if (!current()) return;
                const from = getCalendarFetchWindow().from.getTime();
                const earliest = reviews.reduce((min, review) => Math.min(min, review.reviewedAt), from);
                if (!history || earliest < historyFloor) {
                    const loaded: CalendarSnapshot[] = [];
                    // Include the opening session of the earliest review's gap.
                    let cursor = earliest < from ? earliest - 90 * 86400000 : from;
                    while (cursor < from) {
                        const end = Math.min(from, cursor + 365 * 86400000);
                        const chunk = await getCalendar(new Date(cursor), new Date(end));
                        if (!current()) return;
                        // A concurrent edit must not combine two calendar revisions.
                        if (revision !== null && chunk.revision !== revision) return;
                        loaded.push(chunk);
                        cursor = end;
                    }
                    history = loaded;
                    historyFloor = earliest;
                }
                const allSessions = new Map(history.flatMap((chunk) => chunk.sessions).map((session) => [session._id, session]));
                const allReminders = new Map(history.flatMap((chunk) => chunk.reminders)
                    .filter((reminder) => Date.parse(reminder.dueAtUtc) < from).map((reminder) => [reminder.id, reminder]));
                scheduleSessions.forEach((session) => allSessions.set(session._id, session));
                reminders.forEach((reminder) => allReminders.set(reminder.id, reminder));
                const calendar: CalendarSnapshot = {
                    ...settings, revision: revision ?? 0, series: [],
                    sessions: [...allSessions.values()], reminders: [...allReminders.values()],
                };
                const timeline = buildProgressTimeline(progressSlots(calendar, reviews), new Date(), settings.timeZone, i18n.resolvedLanguage ?? 'en');
                if (current()) await writeProgressWidget(owner, timeline);
            } catch {
                // Keep the last valid timeline when offline. Retry on foreground,
                // a mutation, or the next successful calendar refresh.
            }
        };
        void sync();
        const unsubscribe = subscribeProgressChanges(() => { void sync(); });
        const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void sync(); });
        return () => { disposed = true; unsubscribe(); subscription.remove(); };
    }, [owner, authReady, hydrated, scheduleSessions, reminders, settings, revision, i18n.resolvedLanguage]);
    return null;
}
