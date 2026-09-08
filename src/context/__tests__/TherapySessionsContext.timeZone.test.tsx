import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import { useTimeZoneSync } from '../../hooks/useTimeZoneSync';
import { updateCurrentUser } from '../../api/users';
import { getReminders } from '../../api/reminders';
import { readRemindersCache } from '../../features/reminders/remindersCache';
import { Reason } from '../../features/reminders/types';

jest.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: 'travel-user' } }),
}));
jest.mock('../../api/therapy', () => ({ getTherapySessions: jest.fn(async () => []), syncTherapySessions: jest.fn() }));
jest.mock('../../api/users', () => ({ updateCurrentUser: jest.fn() }));
jest.mock('../../api/reminders', () => ({ getReminders: jest.fn() }));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
};
const schedule = (timeZone: string) => ({
    timeZone,
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
    reminders: [{ atUtc: timeZone === 'Europe/London' ? '2026-09-06T06:30:00Z' : '2026-09-06T11:30:00Z', localDate: '2026-09-06', reason: Reason.PostSession, gapIndex: 1 }],
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

it.each(['before', 'after'] as const)('keeps the new schedule when the old GET resolves %s the zone PATCH', async (order) => {
    const patch = deferred<void>();
    const oldGet = deferred<ReturnType<typeof schedule>>();
    jest.mocked(updateCurrentUser).mockReturnValueOnce(patch.promise as never);
    jest.mocked(getReminders).mockReturnValueOnce(oldGet.promise).mockResolvedValueOnce(schedule('America/New_York'));
    const { result } = renderHook(() => {
        const sessions = useTherapySessions();
        useTimeZoneSync(sessions.refreshReminderSchedule);
        return sessions;
    }, { wrapper });
    await waitFor(() => expect(getReminders).toHaveBeenCalledTimes(1));

    if (order === 'before') {
        await act(async () => { oldGet.resolve(schedule('Europe/London')); });
        await waitFor(() => expect(result.current.reminderScheduleSettings?.timeZone).toBe('Europe/London'));
    }
    await act(async () => { patch.resolve(); });
    await waitFor(() => expect(getReminders).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.reminderScheduleSettings?.timeZone).toBe('America/New_York'));
    if (order === 'after') await act(async () => { oldGet.resolve(schedule('Europe/London')); });

    expect(result.current.neuroReminders).toEqual(schedule('America/New_York').reminders);
    expect(result.current.reminderScheduleStatus).toBe('ready');
    const cached = await readRemindersCache('travel-user');
    expect(cached?.timeZone).toBe('America/New_York');
    expect(cached?.reminders).toEqual(schedule('America/New_York').reminders);
});
