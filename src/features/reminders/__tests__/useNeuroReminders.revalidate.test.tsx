import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNeuroReminders } from '../useNeuroReminders';
import * as remindersApi from '../../../api/reminders';

jest.mock('../../../api/reminders', () => ({
    getReminders: jest.fn(),
}));

const { getReminders } = jest.mocked(remindersApi);

const SESSIONS = [{ _id: 's1', startsAtUtc: '2026-09-02T10:00:00.000Z' }];

const response = (id: string) => ({
    reminders: [{ id } as never],
    timeZone: 'Europe/London',
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

    it('retries a failed fetch when the app returns to the foreground', async () => {
        const listeners = captureAppStateListener();
        getReminders.mockRejectedValueOnce(new Error('offline'));

        const { result } = renderHook(() =>
            useNeuroReminders(SESSIONS, 'Europe/London', true, true),
        );

        // The initial revalidation fails and, by design, leaves what it had.
        await waitFor(() => {
            expect(getReminders).toHaveBeenCalledTimes(1);
        });
        expect(result.current).toEqual([]);

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
    });

    it('arms a timer for the midnight that passes while the app stays open', async () => {
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
