import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockShowAlert = jest.fn();
const mockGetSettings = jest.fn();
const mockUpdateSettings = jest.fn();
const mockRefreshSchedule = jest.fn();
const mockReadPermission = jest.fn();

jest.mock('expo-router', () => ({
	useRouter: () => ({ back: mockBack }),
}));

jest.mock('../../src/api/users', () => ({
	getCurrentUserSettings: (...args: unknown[]) => mockGetSettings(...args),
	updateCurrentUser: (...args: unknown[]) => mockUpdateSettings(...args),
}));

jest.mock('../../src/context/therapy-sessions/TherapySessionsContext', () => ({
	useTherapySessions: () => ({ refreshReminderSchedule: mockRefreshSchedule }),
}));

jest.mock('../../src/features/onboarding/onboardingNotifications', () => ({
	readNotificationPermission: (...args: unknown[]) => mockReadPermission(...args),
}));

jest.mock('../../src/context/alert', () => ({
	useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/components/settings/SettingsPageShell', () => {
	const ReactForMock = require('react');
	const { Text: MockText, View: MockView } = require('react-native');
	return {
		SettingsPageShell: ({ title, children }: { title?: string; children: React.ReactNode }) =>
			ReactForMock.createElement(
				MockView,
				null,
				ReactForMock.createElement(MockText, null, title),
				children,
			),
	};
});

jest.mock('../../src/components/ui/FrostedCard', () => {
	const ReactForMock = require('react');
	const { View: MockView } = require('react-native');
	return {
		__esModule: true,
		default: ({ children }: { children: React.ReactNode }) =>
			ReactForMock.createElement(MockView, null, children),
	};
});

jest.mock('../../src/components/SettingsRow', () => {
	const ReactForMock = require('react');
	const { Pressable: MockPressable, Text: MockText } = require('react-native');
	return {
		SettingsRow: ({ text, onPress }: { text: string; onPress: () => void }) =>
			ReactForMock.createElement(
				MockPressable,
				{ onPress },
				ReactForMock.createElement(MockText, null, text),
			),
	};
});

jest.mock('../../src/components/ui/Loading', () => {
	const ReactForMock = require('react');
	const { Text: MockText } = require('react-native');
	return {
		__esModule: true,
		default: () => ReactForMock.createElement(MockText, null, 'Loading'),
	};
});

jest.mock('@react-native-community/datetimepicker', () => {
	const ReactForMock = require('react');
	const { Pressable: MockPressable, Text: MockText } = require('react-native');
	return {
		__esModule: true,
		default: ({
			value,
			onChange,
		}: {
			value: Date;
			onChange: (event: unknown, date: Date) => void;
		}) =>
			ReactForMock.createElement(
				MockPressable,
				{ onPress: () => onChange({}, new Date(2026, 0, 1, 9, 15)) },
				ReactForMock.createElement(
					MockText,
					null,
					`picker:${value.getHours()}:${value.getMinutes()}`,
				),
			),
	};
});

import ReminderSettingsScreen from '../reminder-settings';

describe('reminder settings', () => {
	beforeAll(() => {
		Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockGetSettings.mockResolvedValue({
			morningReminderMinutes: 390,
			eveningReminderMinutes: 1335,
		});
		mockReadPermission.mockResolvedValue({ granted: true, canAskAgain: true });
		mockUpdateSettings.mockResolvedValue(undefined);
		mockRefreshSchedule.mockResolvedValue(undefined);
	});

	it('loads saved choices and refreshes the calendar after an edit', async () => {
		const { getByText } = render(<ReminderSettingsScreen />);

		await waitFor(() => {
			expect(getByText('picker:6:30')).not.toBeNull();
			expect(getByText('picker:22:15')).not.toBeNull();
			expect(getByText('Notification permissions: On')).not.toBeNull();
		});

		fireEvent.press(getByText('picker:6:30'));
		fireEvent.press(getByText('Save reminder times'));

		await waitFor(() =>
			expect(mockUpdateSettings).toHaveBeenCalledWith({
				morningReminderMinutes: 555,
				eveningReminderMinutes: 1335,
			}),
		);
		expect(mockRefreshSchedule).toHaveBeenCalledTimes(1);
		expect(mockShowAlert).toHaveBeenCalledWith(
			'Reminder times updated',
			'Your future reviews will use these times.',
		);
	});

	it('still loads saved times if checking notification permission fails', async () => {
		mockReadPermission.mockRejectedValue(new Error('native permission unavailable'));

		const { getByText } = render(<ReminderSettingsScreen />);

		await waitFor(() => {
			expect(getByText('picker:6:30')).not.toBeNull();
			expect(getByText('Notification permissions: Off')).not.toBeNull();
		});
		expect(mockShowAlert).not.toHaveBeenCalledWith(
			"We couldn't load reminder settings",
			expect.anything(),
		);
	});
});
