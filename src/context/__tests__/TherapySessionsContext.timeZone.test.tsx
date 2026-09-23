import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import { useTimeZoneSync } from '../../hooks/useTimeZoneSync';
import { updateCurrentUser } from '../../api/users';
import { getCalendar, type CalendarSnapshot } from '../../api/therapy';
import { readCalendarSnapshot } from '../../features/calendar/calendarSnapshotCache';
import { Reason } from '../../features/reminders/types';

jest.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: 'travel-user' } }),
}));
jest.mock('../../api/therapy', () => ({
    getCalendar: jest.fn(), createSession: jest.fn(), updateSession: jest.fn(), deleteSession: jest.fn(),
}));
jest.mock('../../api/users', () => ({ updateCurrentUser: jest.fn() }));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};
const calendar = (timeZone: string): CalendarSnapshot => ({
    revision: timeZone === 'Europe/London' ? 1 : 2,
    timeZone,
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
    sessions: [],
    series: [],
    reminders: [{
        id: `r-${timeZone}`, kind: 'review_note', reason: Reason.PostSession, gapIndex: 1, sessionId: 's1', status: 'pending',
        dueAtUtc: timeZone === 'Europe/London' ? '2026-09-06T06:30:00Z' : '2026-09-06T11:30:00Z', localDate: '2026-09-06',
    }],
});
const wrapper = ({ children }: { children: React.ReactNode }) => <TherapySessionsProvider>{children}</TherapySessionsProvider>;

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    }) as Intl.DateTimeFormat);
});
afterEach(() => { jest.restoreAllMocks(); });

/**
 * Travel: the device reports a new zone, the app tells the server, and the
 * server rebuilds the plan in that zone. The GET that was already in flight
 * when the PATCH went out still describes the old zone, and must lose to the
 * one fetched afterwards whichever order they resolve in.
 */
it.each(['before', 'after'] as const)('keeps the new calendar when the old GET resolves %s the zone PATCH', async (order) => {
    const patch = deferred<void>();
    const oldGet = deferred<CalendarSnapshot>();
    jest.mocked(updateCurrentUser).mockReturnValueOnce(patch.promise as never);
    jest.mocked(getCalendar).mockReturnValueOnce(oldGet.promise).mockResolvedValueOnce(calendar('America/New_York'));
    const { result } = renderHook(() => {
        const sessions = useTherapySessions();
        useTimeZoneSync(sessions.refreshReminderSchedule);
        return sessions;
    }, { wrapper });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));

    if (order === 'before') {
        await act(async () => { oldGet.resolve(calendar('Europe/London')); });
        await waitFor(() => expect(result.current.reminderScheduleSettings?.timeZone).toBe('Europe/London'));
    }
    await act(async () => { patch.resolve(); });
    await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.reminderScheduleSettings?.timeZone).toBe('America/New_York'));
    if (order === 'after') await act(async () => { oldGet.resolve(calendar('Europe/London')); });

    expect(result.current.reminders).toEqual(calendar('America/New_York').reminders);
    expect(result.current.reminderScheduleStatus).toBe('ready');
    await waitFor(async () => {
        const cached = await readCalendarSnapshot('travel-user');
        expect(cached?.timeZone).toBe('America/New_York');
    });
});
