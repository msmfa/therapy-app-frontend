import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import * as therapyModule from '../../src/api/therapy';
import { TherapySessionsProvider } from '../../src/context/therapy-sessions/TherapySessionsContext';

// A fresh sign-in whose calendar request fails has no calendar, cached or
// fetched, to seed the Schedule page from. It used to spin until the app was
// backgrounded or midnight passed.

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: 'fresh-user' } }),
}));
jest.mock('../../src/api/therapy', () => ({ getCalendar: jest.fn() }));
jest.mock('../../src/features/calendar/calendarSnapshotCache', () => ({
    readCalendarSnapshot: jest.fn(async () => null),
    writeCalendarSnapshot: jest.fn(async () => undefined),
    clearCalendarSnapshot: jest.fn(async () => undefined),
}));
jest.mock('../../src/services/notifications/permission', () => ({
    askForNotificationsAfterSessionAdded: jest.fn(async () => undefined),
}));
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: jest.fn() }) }));
jest.mock('../../src/components/settings/SettingsPageShell', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return {
        SettingsPageShell: ({ children }: { children: React.ReactNode }) =>
            ReactForMock.createElement(MockView, null, children),
    };
});
jest.mock('../../src/components/ui/FrostedCard', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return {
        __esModule: true,
        default: ({ children }: { children: React.ReactNode }) => ReactForMock.createElement(MockView, null, children),
    };
});
jest.mock('../../src/components/ui/Loading', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return { __esModule: true, default: () => ReactForMock.createElement(MockText, null, 'Loading') };
});
jest.mock('../../src/components/schedule/ClearFutureConfirm', () => ({ ClearFutureConfirm: () => null }));
jest.mock('@react-native-community/datetimepicker', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return {
        __esModule: true,
        default: ({ mode, value }: { mode: string; value: Date }) =>
            ReactForMock.createElement(MockText, null, `picker:${mode}:${value.getHours()}:${value.getMinutes()}`),
    };
});

import SessionScheduleScreen from '../session-schedule';

const { getCalendar } = jest.mocked(therapyModule);

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

it('says the calendar could not be loaded and retries on request, instead of spinning forever', async () => {
    getCalendar.mockRejectedValue(new TypeError('Network request failed'));
    const view = render(<TherapySessionsProvider><SessionScheduleScreen /></TherapySessionsProvider>);

    await waitFor(() => expect(view.getByText('Try again')).not.toBeNull());
    expect(view.queryByText('Loading')).toBeNull();
    expect(view.getByText(/offline/i)).not.toBeNull();
    // It does not keep hammering the server on its own.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 300)); });
    const callsBeforeRetry = getCalendar.mock.calls.length;

    getCalendar.mockResolvedValue({
        revision: 1,
        timeZone: 'UTC',
        morningReminderMinutes: 420,
        eveningReminderMinutes: 1200,
        sessions: [],
        series: [],
        reminders: [],
    });
    fireEvent.press(view.getByText('Try again'));

    await waitFor(() => expect(view.getByText('picker:time:7:0')).not.toBeNull());
    expect(getCalendar.mock.calls.length).toBe(callsBeforeRetry + 1);
    expect(view.queryByText('Try again')).toBeNull();
});
