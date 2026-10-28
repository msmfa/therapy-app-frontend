import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import {
    clearFutureSchedule as clearFutureScheduleApi,
    createSession as createSessionApi,
    deleteSession as deleteSessionApi,
    getCalendar,
    replaceSchedule as replaceScheduleApi,
    updateSession as updateSessionApi,
    type CalendarReminder,
    type CalendarSnapshot,
    type CreateSessionInput,
    type SessionEditScope,
    type SessionWriteResult,
    type TherapySeries,
    type TherapySession,
    type UpdateSessionInput,
} from '../../api/therapy';
import type { Reminder } from '../../features/reminders/types';
import type { CadenceId } from '../../features/onboarding/onboardingCopy';
import { projectSessions } from '../../features/onboarding/sessionSeries';
import {
    clearCalendarSnapshot,
    readCalendarSnapshot,
    writeCalendarSnapshot,
} from '../../features/calendar/calendarSnapshotCache';
import {
    editableSessionsFrom,
    getCalendarFetchWindow,
    legacyReviewRemindersFrom,
    nextReminderOf,
    nextSessionOf,
    settingsOf,
} from '../../features/calendar/calendarSelectors';
import { mapSessionError, SessionErrorCopy } from '../../features/therapy-sessions/session-error-map';
import { askForNotificationsAfterSessionAdded } from '../../services/notifications/permission';
import { toError } from '../../utils/errors';
import { isWithinSessionsWindow } from '../../utils/sessionWindow';
import { t } from '../../i18n/translate';
import { applyWrite, type CalendarWriteResult } from './applyWrite';

export interface ReminderScheduleSettings {
    timeZone: string;
    morningReminderMinutes: number;
    eveningReminderMinutes: number;
}

export type ReminderScheduleStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AddSeriesInput {
    firstSessionAt: Date;
    cadence: CadenceId | null;
    durationMin: number;
}

export interface ReplaceScheduleInput {
    firstSessionAt: Date;
    cadence: CadenceId;
    durationMin: number;
    /**
     * The revision the schedule was read at. A newer calendar refuses the
     * write rather than being replaced by values the user never saw.
     */
    revision?: number | null;
}

interface TherapySessionsContextType {
    /** Appointments from local midnight today onward: what the calendar edits. */
    sessions: TherapySession[];
    /** The same plus the recent past, for replaying the reminder schedule. */
    scheduleSessions: TherapySession[];
    series: TherapySeries[];
    /** The plan the cron sends from, past rows included with their outcome. */
    reminders: CalendarReminder[];
    /** Future review reminders in the shape the science screen was written against. */
    neuroReminders: Reminder[];
    reminderScheduleSettings: ReminderScheduleSettings | null;
    reminderScheduleStatus: ReminderScheduleStatus;
    /** The server's revision of this calendar, sent back with every edit. */
    revision: number | null;
    /** False until a calendar (cached or fetched) is on hand to draw. */
    hydrated: boolean;
    loading: boolean;
    error: SessionErrorCopy | null;
    nextSession: TherapySession | null;
    nextReminder: CalendarReminder | null;
    refreshSessions: () => Promise<void>;
    /** Kept for the callers that invalidate after a preference write. Same fetch. */
    refreshReminderSchedule: () => Promise<void>;
    addSession: (input: CreateSessionInput) => Promise<SessionWriteResult>;
    updateSession: (id: string, input: UpdateSessionInput) => Promise<void>;
    removeSession: (id: string, scope?: SessionEditScope) => Promise<void>;
    /** Onboarding: one series (or one appointment) without disturbing what exists. */
    addSeries: (input: AddSeriesInput) => Promise<void>;
    /**
     * The schedule screen's Save: everything from now on becomes this
     * schedule. Resolves with the calendar's new revision.
     */
    replaceSchedule: (input: ReplaceScheduleInput) => Promise<number>;
    /** Removes every session from now on and stops every series. */
    clearFutureSessions: () => Promise<void>;
}

const TherapySessionsContext = createContext<TherapySessionsContextType | undefined>(undefined);

/** Everything held per signed-in account, replaced wholesale on a switch. */
type Account = {
    userId: string | null;
    snapshot: CalendarSnapshot | null;
    inFlight: Promise<void> | null;
    /** Bumped per request so a superseded answer can be told from the current one. */
    sequence: number;
};

type CalendarState = {
    owner: Account;
    snapshot: CalendarSnapshot | null;
    loading: boolean;
    error: SessionErrorCopy | null;
    status: ReminderScheduleStatus;
};

const emptyState = (owner: Account): CalendarState => ({
    owner, snapshot: null, loading: false, error: null, status: 'idle',
});

/** How long a failed refetch after a committed write waits before trying once more. */
const POST_WRITE_RETRY_MS = 15_000;

const CADENCE_REPEAT: Record<CadenceId, 'weekly' | 'fortnightly' | 'monthly' | null> = {
    weekly: 'weekly', fortnightly: 'fortnightly', monthly: 'monthly', varies: null,
};

export function TherapySessionsProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const userId = isAuthenticated ? user?.id ?? null : null;
    const accountRef = useRef<Account>({ userId, snapshot: null, inFlight: null, sequence: 0 });
    // Switch identity during render: an effect would allow one frame of the
    // previous user's appointments and would reuse their pending GET.
    if (accountRef.current.userId !== userId) {
        accountRef.current = { userId, snapshot: null, inFlight: null, sequence: 0 };
    }
    const account = accountRef.current;
    const [state, setState] = useState(() => emptyState(account));
    const { snapshot, loading, error, status } = state.owner === account ? state : emptyState(account);

    const patchState = useCallback((patch: Partial<Omit<CalendarState, 'owner'>>) => {
        if (accountRef.current !== account) return;
        setState((current) => ({ ...(current.owner === account ? current : emptyState(account)), ...patch }));
    }, [account]);

    const assertCurrentAccount = useCallback(() => {
        if (!account.userId || accountRef.current !== account) {
            throw new Error(t('calendar:sessionChanged'));
        }
    }, [account]);

    /**
     * Fetches the calendar. Concurrent callers share one request, except when
     * `supersede` is set: then a new request starts and whatever was already
     * in flight is ignored when it lands. That is what a zone or preference
     * change needs, since the server rebuilt the plan after the old request
     * was answered, and its answer must not be allowed to overwrite the new one.
     * A `quiet` fetch leaves the loading and error state alone: it follows a
     * write that already succeeded, so its failure is not news for the screen.
     */
    const fetchCalendar = useCallback(async (supersede: boolean, quiet = false) => {
        if (!account.userId || accountRef.current !== account) return;
        if (account.inFlight && !supersede) return account.inFlight;

        const sequence = ++account.sequence;
        const isCurrent = () => accountRef.current === account && account.sequence === sequence;
        const request: Promise<void> = (async () => {
            if (!quiet) patchState({ loading: true, error: null, status: 'loading' });
            try {
                const { from, to } = getCalendarFetchWindow();
                const data = await getCalendar(from, to);
                if (!isCurrent()) return;
                // Keep an imperative copy too. A caller awaiting this request
                // resumes before React has committed setState, and must still
                // see the canonical calendar that just arrived.
                account.snapshot = data;
                patchState({ snapshot: data, status: 'ready', error: null });
                void writeCalendarSnapshot(account.userId!, data);
            } catch (err) {
                if (!isCurrent()) return;
                if (!quiet) patchState({ error: { ...mapSessionError(err) }, status: 'error' });
                if (!(err instanceof ApiError) || err.status >= 500) {
                    Sentry.withScope((scope) => {
                        scope.setTag('feature', 'therapy-sessions.refreshSessions');
                        scope.setContext('request', { cachedSessions: account.snapshot?.sessions.length ?? 0 });
                        Sentry.captureException(toError(err));
                    });
                }
                console.error('Error loading sessions:', err);
                throw err;
            } finally {
                // A superseded request must not clear the flag the newer one set.
                if (isCurrent()) {
                    account.inFlight = null;
                    patchState({ loading: false });
                }
            }
        })();

        account.inFlight = request;
        return request;
    }, [account, patchState]);

    const refreshSessions = useCallback(() => fetchCalendar(false), [fetchCalendar]);
    const refreshReminderSchedule = useCallback(() => fetchCalendar(true), [fetchCalendar]);

    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (retryTimer.current !== null) clearTimeout(retryTimer.current);
    }, []);

    /** Puts a committed write on screen at once, in both copies of the calendar. */
    const adopt = useCallback((written: CalendarWriteResult) => {
        if (accountRef.current !== account) return;
        if (account.snapshot) account.snapshot = applyWrite(account.snapshot, written);
        setState((current) => (current.owner === account && current.snapshot
            ? { ...current, snapshot: applyWrite(current.snapshot, written) }
            : current));
    }, [account]);

    /**
     * Runs a write, then fetches the calendar the server now holds.
     *
     * A refresh that began before the write can resolve afterward with the old
     * list, so the post-write fetch supersedes it and only the newer answer can
     * reach the screen. A refused edit (someone changed the calendar on another
     * device) refreshes too, so the user is looking at the current calendar
     * when the alert about it appears.
     *
     * Once the server has the write it is saved, whatever happens next. Its
     * answer goes on screen first, so the next edit carries the new revision,
     * and a failed refetch is retried later instead of reported as a failed save.
     */
    const commit = useCallback(async <T extends CalendarWriteResult>(write: () => Promise<T>): Promise<T> => {
        assertCurrentAccount();
        let result: T;
        try {
            result = await write();
        } catch (err) {
            if (err instanceof ApiError && err.status === 412 && accountRef.current === account) {
                await fetchCalendar(true).catch(() => {});
            }
            throw err;
        }
        assertCurrentAccount();
        adopt(result);
        await fetchCalendar(true, true).catch(() => {
            if (retryTimer.current !== null) return;
            retryTimer.current = setTimeout(() => {
                retryTimer.current = null;
                fetchCalendar(false, true).catch(() => {});
            }, POST_WRITE_RETRY_MS);
        });
        return result;
    }, [account, adopt, assertCurrentAccount, fetchCalendar]);

    const revision = snapshot?.revision ?? null;
    const currentRevision = () => account.snapshot?.revision;

    const addSession = useCallback(async (input: CreateSessionInput) => {
        if (!isWithinSessionsWindow(input.startsAtUtc)) throw new Error(t('calendar:outOfRange'));
        const result = await commit(() => createSessionApi(input, currentRevision()));
        void askForNotificationsAfterSessionAdded();
        return result;
    }, [commit]);

    const updateSession = useCallback(async (id: string, input: UpdateSessionInput) => {
        if (input.startsAtUtc && !isWithinSessionsWindow(input.startsAtUtc)) {
            throw new Error(t('calendar:outOfRange'));
        }
        await commit(() => updateSessionApi(id, input, currentRevision()));
    }, [commit]);

    const removeSession = useCallback(async (id: string, scope: SessionEditScope = 'this') => {
        await commit(() => deleteSessionApi(id, scope, currentRevision()));
    }, [commit]);

    const addSeries = useCallback(async ({ firstSessionAt, cadence, durationMin }: AddSeriesInput) => {
        assertCurrentAccount();
        // Onboarding adds a schedule to an account that may already have one.
        // Wait for the canonical calendar rather than deciding against an
        // empty list that the first GET is about to replace.
        if (account.inFlight) await account.inFlight;
        else if (!account.snapshot) await refreshSessions();
        assertCurrentAccount();

        const occupied = new Set(
            (account.snapshot?.sessions ?? []).map((session) => new Date(session.startsAtUtc).toDateString()),
        );
        const repeat = cadence === null ? null : CADENCE_REPEAT[cadence];
        // A returning user who already has an appointment that day keeps it. A
        // repeating plan then starts from its next occurrence instead.
        const candidates = repeat === null
            ? [firstSessionAt]
            : projectSessions({ firstSessionAt, cadence });
        const start = candidates.find((date) => !occupied.has(date.toDateString()));
        if (!start) return;

        await commit(() => createSessionApi(
            { startsAtUtc: start, durationMin, ...(repeat === null ? {} : { repeat }) },
            currentRevision(),
        ));
        void askForNotificationsAfterSessionAdded();
    }, [account, assertCurrentAccount, commit, refreshSessions]);

    const replaceSchedule = useCallback(async ({ firstSessionAt, cadence, durationMin, revision: readAt }: ReplaceScheduleInput) => {
        // The calendar's range, not onboarding's six months: a session already
        // booked further out may keep its date while only how often changes.
        if (firstSessionAt.getTime() <= Date.now() || !isWithinSessionsWindow(firstSessionAt)) {
            throw new Error(t('calendar:outOfRange'));
        }
        const repeat = CADENCE_REPEAT[cadence];
        const result = await commit(() => replaceScheduleApi(
            { startsAtUtc: firstSessionAt, durationMin, ...(repeat === null ? {} : { repeat }) },
            readAt ?? currentRevision(),
        ));
        void askForNotificationsAfterSessionAdded();
        return result.revision;
    }, [commit]);

    const clearFutureSessions = useCallback(async () => {
        await commit(() => clearFutureScheduleApi(currentRevision()));
    }, [commit]);

    // Paint the last known calendar straight away, before the request has
    // answered. It is at worst a day stale, and it is the difference between a
    // month that opens with its dots and one that flashes empty.
    useEffect(() => {
        if (!account.userId) return undefined;
        let cancelled = false;
        void (async () => {
            const cached = await readCalendarSnapshot(account.userId!);
            if (cancelled || !cached || accountRef.current !== account || account.snapshot) return;
            patchState({ snapshot: cached });
        })();
        return () => { cancelled = true; };
    }, [account, patchState]);

    useEffect(() => {
        if (userId === null) return;
        refreshSessions().catch(() => {});
    }, [userId, refreshSessions]);

    // Reminders pass and the next one moves on without anything in the app
    // changing, so returning to the foreground and the local midnight both
    // refetch. Both also retry a failed load.
    useEffect(() => {
        if (userId === null) return undefined;
        const subscription = AppState.addEventListener('change', (next) => {
            if (next === 'active') refreshSessions().catch(() => {});
        });
        let midnightTimer: ReturnType<typeof setTimeout>;
        const armMidnightTimer = () => {
            const now = new Date();
            const justPastMidnight = new Date(now);
            justPastMidnight.setHours(24, 0, 5, 0);
            midnightTimer = setTimeout(() => {
                refreshSessions().catch(() => {});
                armMidnightTimer();
            }, justPastMidnight.getTime() - now.getTime());
        };
        armMidnightTimer();
        return () => {
            subscription.remove();
            clearTimeout(midnightTimer);
        };
    }, [userId, refreshSessions]);

    const previousUserRef = useRef(userId);
    useEffect(() => {
        const previous = previousUserRef.current;
        previousUserRef.current = userId;
        if (previous !== null && userId === null) void clearCalendarSnapshot(previous);
    }, [userId]);

    const scheduleSessions = useMemo(() => snapshot?.sessions ?? [], [snapshot]);
    const sessions = useMemo(() => editableSessionsFrom(scheduleSessions), [scheduleSessions]);
    const reminders = useMemo(() => snapshot?.reminders ?? [], [snapshot]);
    const neuroReminders = useMemo(() => legacyReviewRemindersFrom(reminders), [reminders]);
    const nextSession = useMemo(() => nextSessionOf(sessions), [sessions]);
    const nextReminder = useMemo(() => nextReminderOf(reminders), [reminders]);
    const reminderScheduleSettings = useMemo(() => (snapshot ? settingsOf(snapshot) : null), [snapshot]);

    const value: TherapySessionsContextType = {
        sessions,
        scheduleSessions,
        series: snapshot?.series ?? [],
        reminders,
        neuroReminders,
        reminderScheduleSettings,
        reminderScheduleStatus: userId === null ? 'idle' : status,
        revision,
        hydrated: snapshot !== null,
        loading,
        error,
        nextSession,
        nextReminder,
        refreshSessions,
        refreshReminderSchedule,
        addSession,
        updateSession,
        removeSession,
        addSeries,
        replaceSchedule,
        clearFutureSessions,
    };

    return (
        <TherapySessionsContext.Provider value={ value }>
            { children }
        </TherapySessionsContext.Provider>
    );
}

export function useTherapySessions() {
    const context = useContext(TherapySessionsContext);
    if (!context) {
        throw new Error('useTherapySessions must be used within TherapySessionsProvider');
    }
    return context;
}
