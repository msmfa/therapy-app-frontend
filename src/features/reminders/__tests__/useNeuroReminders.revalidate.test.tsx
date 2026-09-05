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
        getReminders.mockResolvedValueOnce(response('account-b-reminder'));

        const { result, rerender } = renderHook(
            ({ account }) => useNeuroReminders(SESSIONS, 'Europe/London', true, true, 0, undefined, undefined, account),
            { initialProps: { account: 'user-a' } },
        );
        await waitFor(() => expect(result.current).toEqual(cachedA.reminders));
        expect(getReminders).not.toHaveBeenCalled();
        rerender({ account: 'user-b' });
        expect(result.current).toEqual([]);
        await waitFor(() => expect(result.current).toEqual(response('account-b-reminder').reminders));
        expect(getReminders).toHaveBeenCalledTimes(1);
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
