import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import * as therapyModule from '../../src/api/therapy';
import { TherapySessionsProvider, useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';

// Reminder settings against the real calendar context. A failed load used to
// leave an editable form on the defaults, and Save sent both times, so a time
// the user never touched was overwritten. The screen also showed 07:30 for an
// account with no stored morning time, while the server sends at 07:00.

const mockShowAlert = jest.fn();
const mockUpdateSettings = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('../../src/context/auth/AuthContext', () => ({
	useAuth: () => ({ isAuthenticated: true, user: { id: 'user-1' } }),
}));
jest.mock('../../src/api/therapy', () => ({ getCalendar: jest.fn() }));
jest.mock('../../src/api/users', () => ({
	updateCurrentUser: (...args: unknown[]) => mockUpdateSettings(...args),
}));
jest.mock('../../src/features/calendar/calendarSnapshotCache', () => ({
	readCalendarSnapshot: jest.fn(async () => null),
	writeCalendarSnapshot: jest.fn(async () => undefined),
	clearCalendarSnapshot: jest.fn(async () => undefined),
}));
jest.mock('../../src/features/onboarding/onboardingNotifications', () => ({
	readNotificationPermission: jest.fn(async () => ({ granted: true, canAskAgain: true })),
}));
jest.mock('../../src/services/notifications/permission', () => ({
	askForNotificationsAfterSessionAdded: jest.fn(async () => undefined),
}));
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: mockShowAlert }) }));
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
jest.mock('@react-native-community/datetimepicker', () => {
	const ReactForMock = require('react');
	const { Pressable: MockPressable, Text: MockText } = require('react-native');
	return {
		__esModule: true,
		default: ({ value, onChange }: { value: Date; onChange: (event: unknown, date: Date) => void }) =>
			ReactForMock.createElement(
				MockPressable,
				{ onPress: () => onChange({}, new Date(2026, 0, 1, 9, 15)) },
				ReactForMock.createElement(MockText, null, `picker:${value.getHours()}:${value.getMinutes()}`),
			),
	};
});

import ReminderSettingsScreen from '../reminder-settings';

const { getCalendar } = jest.mocked(therapyModule);

const calendar = (morning: number, evening: number): therapyModule.CalendarSnapshot => ({
	revision: 1,
	timeZone: 'UTC',
	morningReminderMinutes: morning,
	eveningReminderMinutes: evening,
	sessions: [],
	series: [],
	reminders: [],
});

const renderScreen = () => render(
	<TherapySessionsProvider>
		<ReminderSettingsScreen />
	</TherapySessionsProvider>,
);

beforeAll(() => {
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
});

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(console, 'error').mockImplementation(() => {});
	mockUpdateSettings.mockResolvedValue(undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

it('shows an error with a retry, not an editable form, when the times cannot be loaded', async () => {
	// The server holds 06:30 and 22:15; the first load fails (offline blip).
	getCalendar.mockRejectedValueOnce(new TypeError('Network request failed'));
	const view = renderScreen();

	await waitFor(() => expect(view.getByText('We couldn’t load reminder settings')).not.toBeNull());
	expect(view.queryByText(/^picker:/)).toBeNull();
	expect(view.queryByText('Save reminder times')).toBeNull();

	getCalendar.mockResolvedValue(calendar(390, 1335));
	fireEvent.press(view.getByText('Try again'));
	await waitFor(() => expect(view.getByText('picker:6:30')).not.toBeNull());
	expect(view.getByText('picker:22:15')).not.toBeNull();

	fireEvent.press(view.getByText('picker:6:30')); // only the morning time changes
	fireEvent.press(view.getByText('Save reminder times'));

	await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledTimes(1));
	expect(mockUpdateSettings).toHaveBeenCalledWith({ morningReminderMinutes: 555 });
});

it('offers a retry when a newer load replaces its own and fails', async () => {
	// The screen's load hangs; the plan is then refetched after a change made
	// elsewhere (a zone or preference update), and that fails too.
	let refreshPlan = () => Promise.resolve();
	const Plan = () => {
		refreshPlan = useTherapySessions().refreshReminderSchedule;
		return null;
	};
	getCalendar.mockImplementationOnce(() => new Promise(() => {}));
	const view = render(
		<TherapySessionsProvider>
			<ReminderSettingsScreen />
			<Plan />
		</TherapySessionsProvider>,
	);
	await waitFor(() => expect(getCalendar).toHaveBeenCalledTimes(1));
	expect(view.getByText('Loading')).not.toBeNull();

	getCalendar.mockRejectedValueOnce(new TypeError('Network request failed'));
	await act(async () => { await refreshPlan().catch(() => {}); });
	expect(getCalendar).toHaveBeenCalledTimes(2);

	await waitFor(() => expect(view.getByText('We couldn’t load reminder settings')).not.toBeNull());
	getCalendar.mockResolvedValueOnce(calendar(390, 1335));
	fireEvent.press(view.getByText('Try again'));
	await waitFor(() => expect(view.getByText('picker:6:30')).not.toBeNull());
	expect(getCalendar).toHaveBeenCalledTimes(3);
});

it('shows the morning time the server sends at when none is stored', async () => {
	// GET /api/calendar fills in the server's 07:00 default, not onboarding's 07:30.
	getCalendar.mockResolvedValue(calendar(420, 1200));
	const view = renderScreen();

	await waitFor(() => expect(view.getByText('picker:7:0')).not.toBeNull());
	expect(view.queryByText('picker:7:30')).toBeNull();
	expect(view.getByText('picker:20:0')).not.toBeNull();
});
