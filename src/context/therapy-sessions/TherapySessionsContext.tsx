import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { ApiError } from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import {
    getTherapySessions,
    TherapySession,
    syncTherapySessions as syncTherapySessionsApi,
} from '../../api/therapy';
import type { Reminder } from '../../features/reminders/types';
import {
    useNeuroReminders,
    type ReminderScheduleSettings,
    type ReminderScheduleStatus,
} from '../../features/reminders/useNeuroReminders';
import { clearRemindersCache } from '../../features/reminders/remindersCache';
import { useDeviceTimeZone } from '../../hooks/useDeviceTimeZone';
import { mapSessionError, SessionErrorCopy } from '../../features/therapy-sessions/session-error-map';
import { toError } from '../../utils/errors';
import { getSessionsWindow as sharedSessionsWindow, isWithinSessionsWindow } from '../../utils/sessionWindow';

interface TherapySessionsContextType {
    sessions: TherapySession[];
    /**
     * The same sessions plus the recent past, for replaying the reminder
     * schedule. Reviews attribute a note to the gap between two sessions, and
     * the session that opened the gap is usually already behind `sessions`'
     * midnight floor by the time a reminder is answered.
     */
    scheduleSessions: TherapySession[];
    loading: boolean;
    error: SessionErrorCopy | null;
    nextSession: TherapySession | null;
    neuroReminders: Reminder[];
    /** The exact zone and minute-level choices used for the fetched schedule. */
    reminderScheduleSettings: ReminderScheduleSettings | null;
    reminderScheduleStatus: ReminderScheduleStatus;
    refreshSessions: () => Promise<void>;
    syncSessions: (selected: Record<string, Date>, duration: number) => Promise<void>;
    /** Adds appointments without deleting sessions already on the calendar. */
    addSessions: (dates: Date[], duration: number) => Promise<void>;
    /** Invalidates cached times and fetches the schedule with new preferences. */
    refreshReminderSchedule: () => Promise<void>;
}

const TherapySessionsContext = createContext<TherapySessionsContextType | undefined>(undefined);

/**
 * The window of sessions the app fetches and edits. Defined in the shared
 * window module alongside the onboarding limit, so a first session the user is
 * allowed to choose can never project a series this query would not return.
 */
const getSessionsWindow = () => sharedSessionsWindow();

/**
 * How far behind the editable window the fetch reaches, so the reviews
 * feature can still see the session that opened a note's gap. 90 days is
 * far longer than any gap between sessions the schedule can span.
 */
const SCHEDULE_HISTORY_DAYS = 90;

/**
 * The window the app *fetches*: the editable window plus the recent past.
 * Only the fetch is widened. The sync's deletion scope stays
 * `getSessionsWindow`, so the backend still only deletes sessions the user
 * can actually see and edit, and past sessions stay untouchable.
 */
const getFetchWindow = () => {
    const { from, to } = getSessionsWindow();
    const fetchFrom = new Date(from);
    fetchFrom.setDate(fetchFrom.getDate() - SCHEDULE_HISTORY_DAYS);

    return { from: fetchFrom, to };
};

const editableSessionsFrom = (allSessions: TherapySession[]): TherapySession[] => {
    const floor = new Date();
    floor.setHours(0, 0, 0, 0);
    const floorMs = floor.getTime();

    return allSessions.filter(
        (session) => new Date(session.startsAtUtc).getTime() >= floorMs,
    );
};

interface TherapySessionsProviderProps {
    children: React.ReactNode;
}

type AccountSessions = {
    userId: string | null;
    sessions: TherapySession[];
    ready: boolean;
    inFlight: Promise<void> | null;
};

type SessionsSnapshot = {
    owner: AccountSessions;
    scheduleSessions: TherapySession[];
    loading: boolean;
    error: SessionErrorCopy | null;
    sessionsReady: boolean;
    reminderScheduleSettings: ReminderScheduleSettings | null;
    reminderScheduleStatus: ReminderScheduleStatus;
};

const emptySnapshot = (owner: AccountSessions): SessionsSnapshot => ({
    owner,
    scheduleSessions: owner.sessions,
    loading: false,
    error: null,
    sessionsReady: false,
    reminderScheduleSettings: null,
    reminderScheduleStatus: 'idle',
});

export function TherapySessionsProvider({ children }: TherapySessionsProviderProps) {
    const { isAuthenticated, user } = useAuth();
    const userId = isAuthenticated ? user?.id ?? null : null;
    const accountRef = useRef<AccountSessions>({ userId, sessions: [], ready: false, inFlight: null });
    // Switch identity during render: an effect would allow one frame of the
    // previous user's appointments and would reuse their pending GET.
    if (accountRef.current.userId !== userId) {
        accountRef.current = { userId, sessions: [], ready: false, inFlight: null };
    }
    const account = accountRef.current;
    const [snapshot, setSnapshot] = useState(() => emptySnapshot(account));
    const {
        scheduleSessions, loading, error, sessionsReady,
        reminderScheduleSettings, reminderScheduleStatus,
    } = snapshot.owner === account ? snapshot : emptySnapshot(account);
    const updateSnapshot = useCallback((patch: Partial<Omit<SessionsSnapshot, 'owner'>>) => {
        if (accountRef.current !== account) return;
        setSnapshot((current) => ({
            ...(current.owner === account ? current : emptySnapshot(account)),
            ...patch,
        }));
    }, [account]);
    const assertCurrentAccount = useCallback(() => {
        if (!account.userId || accountRef.current !== account) {
            throw new Error('Session changed. Please try again.');
        }
    }, [account]);
    const [reminderRefreshSignal, setReminderRefreshSignal] = useState(0);
    const deviceTimeZone = useDeviceTimeZone();

    // What the narrow fetch used to return: local midnight today onward. Every
    // existing consumer (calendar, nextSession, sync payload, reminder cache
    // signature) keeps seeing exactly this; only the reviews feature reads the
    // wider scheduleSessions.
    const sessions = useMemo(
        () => editableSessionsFrom(scheduleSessions),
        [scheduleSessions],
    );

    const refreshSessions = useCallback(async () => {
        if (!account.userId || accountRef.current !== account) {
            return;
        }

        if (account.inFlight) {
            return account.inFlight;
        }

        const request = (async () => {
            updateSnapshot({ loading: true, error: null });
            try {
                const { from, to } = getFetchWindow();

                const data = await getTherapySessions(from, to);
                if (accountRef.current !== account) return;
                // Keep an imperative copy too. A caller awaiting this request
                // resumes before React has committed setState, and must still
                // see the canonical sessions that just arrived.
                account.sessions = data;
                account.ready = true;
                updateSnapshot({ scheduleSessions: data });
            } catch (err) {
                if (accountRef.current !== account) return;
                const mapped = mapSessionError(err);
                updateSnapshot({ error: { ...mapped } });
                const shouldReport = !(err instanceof ApiError) || err.status >= 500;
                if (shouldReport) {
                    Sentry.withScope((scope) => {
                        scope.setTag('feature', 'therapy-sessions.refreshSessions');
                        scope.setContext('request', {
                            cachedSessions: account.sessions.length,
                        });
                        Sentry.captureException(toError(err));
                    });
                }
                console.error('Error loading sessions:', err);
                throw err;
            } finally {
                account.inFlight = null;
                updateSnapshot({ loading: false, sessionsReady: true });
            }
        })();

        account.inFlight = request;
        return request;
    }, [account, updateSnapshot]);

    const syncSessions = useCallback(
        async (selected: Record<string, Date>, duration: number) => {
            assertCurrentAccount();

            // Do not build an all-or-nothing sync against the initial empty
            // state while the first GET is still in flight. That race dropped
            // every pre-existing appointment not present in `selected`.
            const initialRefresh = account.inFlight;
            if (initialRefresh) {
                await initialRefresh;
            } else if (!account.ready) {
                await refreshSessions();
            }

            assertCurrentAccount();
            const currentSessions = editableSessionsFrom(account.sessions);
            const window = getSessionsWindow();
            if (Object.values(selected).some(date => !isWithinSessionsWindow(date, window))) {
                throw new Error('Appointments must be between today and one year ahead. Please update your selection.');
            }

            const payload = Object.values(selected).map((date) => {
                const existing = currentSessions.find(
                    (session) => new Date(session.startsAtUtc).getTime() === date.getTime(),
                );

                return {
                    id: existing?._id,
                    startsAtUtc: date.toISOString(),
                    durationMin: existing?.durationMin ?? duration,
                };
            });

            await syncTherapySessionsApi(payload, window);
            assertCurrentAccount();

            // A refresh that began before the write can resolve afterward with
            // the old session list. Wait for it to finish, then start a fresh
            // post-write GET so reminders can only be derived from canonical
            // data that was fetched after the sync completed.
            const staleRefresh = account.inFlight;
            if (staleRefresh) {
                await staleRefresh.catch(() => {});
            }

            assertCurrentAccount();
            await refreshSessions();
        },
        [account, assertCurrentAccount, refreshSessions],
    );

    const addSessions = useCallback(
        async (dates: Date[], duration: number) => {
            assertCurrentAccount();

            const initialRefresh = account.inFlight;
            if (initialRefresh) {
                await initialRefresh;
            } else if (!account.ready) {
                await refreshSessions();
            }

            assertCurrentAccount();
            // Onboarding adds its projected schedule to an account. It must
            // not behave like the calendar's replace operation and silently
            // delete appointments a returning user already has.
            const selected: Record<string, Date> = {};
            for (const session of editableSessionsFrom(account.sessions)) {
                const date = new Date(session.startsAtUtc);
                selected[date.toISOString()] = date;
            }
            for (const date of dates) {
                selected[date.toISOString()] = date;
            }

            await syncSessions(selected, duration);
        },
        [account, assertCurrentAccount, refreshSessions, syncSessions],
    );

    const nextSession = useMemo(() => {
        const now = Date.now();
        let earliest: TherapySession | null = null;
        let earliestStart = Number.POSITIVE_INFINITY;

        sessions.forEach((session) => {
            const start = new Date(session.startsAtUtc).getTime();
            if (start > now && start < earliestStart) {
                earliest = session;
                earliestStart = start;
            }
        });

        return earliest;
    }, [sessions]);

    // Fetched from the server rather than computed here, so the plan shown to
    // the user is the plan the cron will send. deviceTimeZone is passed in
    // because travelling has to invalidate the cached schedule: the sessions
    // are unchanged, but the wall-clock times they resolve to are not.
    const setReminderScheduleSettings = useCallback((settings: ReminderScheduleSettings | null) => {
        updateSnapshot({ reminderScheduleSettings: settings });
    }, [updateSnapshot]);
    const setReminderScheduleStatus = useCallback((status: ReminderScheduleStatus) => {
        updateSnapshot({ reminderScheduleStatus: status });
    }, [updateSnapshot]);
    const neuroReminders = useNeuroReminders(
        sessions,
        deviceTimeZone,
        userId !== null,
        sessionsReady,
        reminderRefreshSignal,
        setReminderScheduleSettings,
        setReminderScheduleStatus,
        userId ?? 'signed-out',
    );

    const refreshReminderSchedule = useCallback(async () => {
        assertCurrentAccount();
        await clearRemindersCache(account.userId!);
        assertCurrentAccount();
        updateSnapshot({ reminderScheduleSettings: null, reminderScheduleStatus: 'loading' });
        setReminderRefreshSignal((current) => current + 1);
    }, [account, assertCurrentAccount, updateSnapshot]);

    useEffect(() => {
        if (userId !== null) {
            refreshSessions().catch(() => {});
        }
    }, [userId, refreshSessions]);

    const value: TherapySessionsContextType = {
        sessions,
        scheduleSessions,
        loading,
        error,
        nextSession,
        neuroReminders,
        reminderScheduleSettings,
        reminderScheduleStatus,
        refreshSessions,
        syncSessions,
        addSessions,
        refreshReminderSchedule,
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
