import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNeuroReminders } from '../useNeuroReminders';
import * as remindersApi from '../../../api/reminders';
import { getLocalDateKey, getSessionsSignature, readRemindersCache, writeRemindersCache } from '../remindersCache';

jest.mock('../../../api/reminders', () => ({
    getReminders: jest.fn(),
}));

const { getReminders } = jest.mocked(remindersApi);

const SESSIONS = [{ _id: 's1', startsAtUtc: '2026-09-02T10:00:00.000Z' }];

const response = (id: string) => ({
    reminders: [{ id } as never],
    timeZone: 'Europe/London',
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
});

type Listener = (state: AppStateStatus) => void;

function captureAppStateListener() {
    const listeners: Listener[] = [];

    jest.spyOn(AppState, 'addEventListener').mockImplementation(
        (_type: string, listener: Listener) => {
            listeners.push(listener);
            return { remove: jest.fn() } as never;
        },
    );

    return listeners;
}

describe('useNeuroReminders revalidation triggers', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        // The hook caches successful fetches; a usable entry left by one test
        // makes the next one skip the network entirely.
        await AsyncStorage.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('does not show another account’s cache, even when both have the same sessions', async () => {
        const cachedA = {
            ...response('account-a-private-reminder'),
            deviceTimeZone: 'Europe/London',
            sessionsSignature: getSessionsSignature(SESSIONS),
            localDate: getLocalDateKey(),
        };
        await writeRemindersCache(cachedA, 'user-a');
        // An older app version could have left a cache without an owner too.
        await writeRemindersCache(cachedA);
        getReminders.mockResolvedValueOnce(response('account-a-private-reminder'))
            .mockResolvedValueOnce(response('account-b-reminder'));

        const { result, rerender } = renderHook(
            ({ account }) => useNeuroReminders(SESSIONS, 'Europe/London', true, true, 0, undefined, undefined, account),
            { initialProps: { account: 'user-a' } },
        );
        await waitFor(() => expect(result.current).toEqual(cachedA.reminders));
        await waitFor(() => expect(getReminders).toHaveBeenCalledTimes(1));
        rerender({ account: 'user-b' });
        expect(result.current).toEqual([]);
        await waitFor(() => expect(result.current).toEqual(response('account-b-reminder').reminders));
        expect(getReminders).toHaveBeenCalledTimes(2);
        expect((await readRemindersCache('user-a'))?.reminders).toEqual(cachedA.reminders);
        expect((await readRemindersCache('user-b'))?.reminders).toEqual(response('account-b-reminder').reminders);
    });

    it('ignores a late account A reminder response after account B signs in', async () => {
        let finishA!: (value: ReturnType<typeof response>) => void;
        getReminders.mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; }))
            .mockResolvedValueOnce(response('account-b-reminder'));
        const { result, rerender } = renderHook(
            ({ account }) => useNeuroReminders(SESSIONS, 'Europe/London', true, true, 0, undefined, undefined, account),
            { initialProps: { account: 'user-a' } },
        );
        await waitFor(() => expect(getReminders).toHaveBeenCalledTimes(1));
        rerender({ account: 'user-b' });
        await waitFor(() => expect(result.current).toEqual(response('account-b-reminder').reminders));
        await act(async () => { finishA(response('late-account-a-reminder')); });

        expect(result.current).toEqual(response('account-b-reminder').reminders);
        expect(await readRemindersCache('user-a')).toBeNull();
        expect((await readRemindersCache('user-b'))?.reminders).toEqual(response('account-b-reminder').reminders);
    });

    it('retries a failed fetch when the app returns to the foreground', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const listeners = captureAppStateListener();
        const status = jest.fn();
        getReminders.mockRejectedValueOnce(new Error('offline'));

        const { result } = renderHook(() =>
            useNeuroReminders(
                SESSIONS,
                'Europe/London',
                true,
                true,
                0,
                undefined,
                status,
            ),
        );

        // The initial revalidation fails and, by design, leaves what it had.
        await waitFor(() => {
            expect(getReminders).toHaveBeenCalledTimes(1);
        });
        expect(result.current).toEqual([]);
        expect(status).toHaveBeenLastCalledWith('error');

        // Connectivity is back; the user foregrounds the app. Before the
        // foreground trigger existed, nothing retried until a session or zone
        // change, and the calendar stayed empty indefinitely.
        getReminders.mockResolvedValueOnce(response('after-retry'));

        await act(async () => {
            listeners.forEach((listener) => listener('active'));
        });

        await waitFor(() => {
            expect(getReminders).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
            expect(result.current).toEqual(response('after-retry').reminders);
        });
        expect(status).toHaveBeenLastCalledWith('ready');
        expect(warn).toHaveBeenCalledWith(
            '[Reminders] Failed to load reminder schedule:',
            expect.any(Error),
        );
    });

    it('revalidates surviving disk cache on a cold mount before marking the schedule ready', async () => {
        const oldCache = {
            ...response('old-preference-reminder'),
            deviceTimeZone: 'Europe/London',
            sessionsSignature: getSessionsSignature(SESSIONS),
            localDate: getLocalDateKey(),
        };
        // This is what a new process sees if a previous process failed to
        // delete the cache after saving changed preferences on the server.
        await AsyncStorage.setItem('neuroReminders:v3:restarted-account', JSON.stringify(oldCache));
        let finishFetch!: (value: ReturnType<typeof response>) => void;
        getReminders.mockImplementationOnce(() => new Promise((resolve) => { finishFetch = resolve; }));
        const status = jest.fn();
        const settings = jest.fn();
        const listeners = captureAppStateListener();
        const { result } = renderHook(() => useNeuroReminders(
            SESSIONS, 'Europe/London', true, true, 0, settings, status, 'restarted-account',
        ));

        await waitFor(() => expect(getReminders).toHaveBeenCalledTimes(1));
        expect(result.current).toEqual(oldCache.reminders);
        expect(status).not.toHaveBeenCalledWith('ready');

        const updated = { ...response('new-preference-reminder'), morningReminderMinutes: 480 };
        await act(async () => { finishFetch(updated); });
        await waitFor(() => expect(result.current).toEqual(updated.reminders));
        expect(settings).toHaveBeenLastCalledWith({
            timeZone: updated.timeZone,
            morningReminderMinutes: 480,
            eveningReminderMinutes: updated.eveningReminderMinutes,
        });
        expect(status).toHaveBeenLastCalledWith('ready');
        expect((await readRemindersCache('restarted-account'))?.morningReminderMinutes).toBe(480);

        await act(async () => { listeners.forEach((listener) => listener('active')); });
        expect(getReminders).toHaveBeenCalledTimes(1);
    });

    it('keeps the offline cache visible but retries initial validation on foreground', async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        const cached = {
            ...response('offline-reminder'),
            deviceTimeZone: 'Europe/London',
            sessionsSignature: getSessionsSignature(SESSIONS),
            localDate: getLocalDateKey(),
        };
        await writeRemindersCache(cached, 'offline-account');
        getReminders.mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response('fresh-reminder'));
        const listeners = captureAppStateListener();
        const status = jest.fn();
        const { result } = renderHook(() => useNeuroReminders(
            SESSIONS, 'Europe/London', true, true, 0, undefined, status, 'offline-account',
        ));

        await waitFor(() => expect(status).toHaveBeenLastCalledWith('error'));
        expect(result.current).toEqual(cached.reminders);
        expect(status).not.toHaveBeenCalledWith('ready');

        await act(async () => { listeners.forEach((listener) => listener('active')); });
        expect(getReminders).toHaveBeenCalledTimes(2);
        expect(result.current).toEqual(response('fresh-reminder').reminders);
        expect(status).toHaveBeenLastCalledWith('ready');
    });

    it('does not revert to stale disk preferences when persisting a fresh response fails', async () => {
        const oldCache = {
            ...response('old-reminder'),
            deviceTimeZone: 'Europe/London',
            sessionsSignature: getSessionsSignature(SESSIONS),
            localDate: getLocalDateKey(),
        };
        await AsyncStorage.setItem('neuroReminders:v3:failed-refresh-write', JSON.stringify(oldCache));
        jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage unavailable'));
        const updated = { ...response('fresh-reminder'), morningReminderMinutes: 480 };
        getReminders.mockResolvedValue(updated);
        const listeners = captureAppStateListener();
        const settings = jest.fn();
        const { result } = renderHook(() => useNeuroReminders(
            SESSIONS, 'Europe/London', true, true, 0, settings, undefined, 'failed-refresh-write',
        ));

        await waitFor(() => expect(result.current).toEqual(updated.reminders));
        expect((await readRemindersCache('failed-refresh-write'))?.morningReminderMinutes).toBe(450);

        await act(async () => { listeners.forEach((listener) => listener('active')); });

        expect(getReminders).toHaveBeenCalledTimes(2);
        expect(result.current).toEqual(updated.reminders);
        expect(settings).toHaveBeenLastCalledWith({
            timeZone: updated.timeZone,
            morningReminderMinutes: 480,
            eveningReminderMinutes: updated.eveningReminderMinutes,
        });
        expect((await readRemindersCache('failed-refresh-write'))?.morningReminderMinutes).toBe(480);
    });

    it('arms a timer for the midnight that passes while the app stays open', async () => {
        jest.useFakeTimers();
        captureAppStateListener();
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        getReminders.mockResolvedValue(response('initial'));

        renderHook(() => useNeuroReminders(SESSIONS, 'Europe/London', true, true));

        await waitFor(() => {
            expect(getReminders).toHaveBeenCalled();
        });

        // A timer scheduled for just past local midnight: strictly in the
        // future, at most a day away.
        const dayMs = 24 * 60 * 60 * 1000;
        const midnightDelays = setTimeoutSpy.mock.calls
            .map(([, delay]) => delay as number)
            .filter((delay) => typeof delay === 'number' && delay > 60 * 1000);

        expect(midnightDelays.length).toBeGreaterThanOrEqual(1);
        expect(Math.max(...midnightDelays)).toBeLessThanOrEqual(dayMs + 5000);
    });
});
