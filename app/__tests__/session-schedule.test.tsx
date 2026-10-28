import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ApiError } from '../../src/api/client';

const mockBack = jest.fn();
const mockShowAlert = jest.fn();
const mockUpdateCurrentUser = jest.fn(async () => undefined);
let mockSessions: {
	hydrated: boolean;
	revision: number | null;
	refreshSessions: jest.Mock;
	nextSession: { startsAtUtc: string; seriesId?: string; durationMin?: number } | null;
	series: { id: string; cadence: string }[];
	reminderScheduleSettings: { morningReminderMinutes: number; eveningReminderMinutes: number } | null;
	replaceSchedule: jest.Mock;
	clearFutureSessions: jest.Mock;
	refreshReminderSchedule: jest.Mock;
};

jest.mock('expo-router', () => ({
	useRouter: () => ({ back: mockBack }),
}));

jest.mock('../../src/context/alert', () => ({
	useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/api/users', () => ({
	updateCurrentUser: (...args: unknown[]) => mockUpdateCurrentUser(...(args as [])),
}));

jest.mock('../../src/context/therapy-sessions/TherapySessionsContext', () => ({
	useTherapySessions: () => mockSessions,
}));

jest.mock('../../src/components/settings/SettingsPageShell', () => {
	const ReactForMock = require('react');
	const { Text: MockText, View: MockView } = require('react-native');
	return {
		SettingsPageShell: ({ title, children }: { title?: string; children: React.ReactNode }) =>
			ReactForMock.createElement(MockView, null, ReactForMock.createElement(MockText, null, title), children),
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

jest.mock('../../src/components/schedule/ClearFutureConfirm', () => {
	const ReactForMock = require('react');
	const { Text: MockText } = require('react-native');
	return {
		ClearFutureConfirm: ({ visible, onConfirm }: { visible: boolean; onConfirm: () => void }) =>
			visible ? ReactForMock.createElement(MockText, { onPress: onConfirm }, 'confirm:clear') : null,
	};
});

jest.mock('@react-native-community/datetimepicker', () => {
	const ReactForMock = require('react');
	const { Text: MockText } = require('react-native');
	return {
		__esModule: true,
		default: ({ mode, value, onChange, testID }: { mode: string; value: Date; onChange: unknown; testID?: string }) =>
			ReactForMock.createElement(MockText, { onChange, testID }, `picker:${mode}:${value.getHours()}:${value.getMinutes()}`),
	};
});

import SessionScheduleScreen from '../session-schedule';

/** Renders the page and lets its fresh calendar request settle. */
const renderScreen = async () => {
	const view = render(<SessionScheduleScreen />);
	await act(async () => {});
	return view;
};

const chooseCadence = (view: Awaited<ReturnType<typeof renderScreen>>, id: string) => {
	fireEvent.press(view.getByTestId('session-schedule.cadence'));
	fireEvent.press(view.getByTestId(`session-schedule.cadence.${id}`));
};

describe('session schedule', () => {
	beforeAll(() => {
		Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] });
		jest.setSystemTime(new Date(2026, 9, 28, 12, 0));
		mockSessions = {
			hydrated: true,
			revision: 7,
			refreshSessions: jest.fn(async () => undefined),
			nextSession: { startsAtUtc: new Date(2026, 10, 12, 17, 0).toISOString(), seriesId: 'ser', durationMin: 50 },
			series: [{ id: 'ser', cadence: 'fortnightly' }],
			reminderScheduleSettings: { morningReminderMinutes: 450, eveningReminderMinutes: 1200 },
			replaceSchedule: jest.fn(async () => 8),
			clearFutureSessions: jest.fn(async () => undefined),
			refreshReminderSchedule: jest.fn(async () => undefined),
		};
	});

	it('shows the next session and reminder times in compact pickers', async () => {
		const { getAllByText, getByText } = await renderScreen();

		expect(getByText('picker:date:17:0')).not.toBeNull();
		expect(getByText('picker:time:17:0')).not.toBeNull();
		expect(getByText('picker:time:7:30')).not.toBeNull();
		expect(getByText('picker:time:20:0')).not.toBeNull();
		expect(getAllByText('Every two weeks')).toHaveLength(1);
	});

	it('changes how often from a dropdown, as on the language page', async () => {
		const { getByTestId, getByText, queryByTestId } = await renderScreen();

		expect(queryByTestId('session-schedule.cadence.monthly')).toBeNull();
		fireEvent.press(getByTestId('session-schedule.cadence'));
		fireEvent.press(getByTestId('session-schedule.cadence.monthly'));

		expect(queryByTestId('session-schedule.cadence.monthly')).toBeNull();
		expect(getByText('Once a month')).not.toBeNull();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('asks before clearing future sessions, then clears them and closes', async () => {
		const { getByText, queryByText } = await renderScreen();

		expect(queryByText('confirm:clear')).toBeNull();
		fireEvent.press(getByText('Clear future sessions'));
		expect(mockSessions.clearFutureSessions).not.toHaveBeenCalled();
		await act(async () => { fireEvent.press(getByText('confirm:clear')); });

		expect(mockSessions.clearFutureSessions).toHaveBeenCalledTimes(1);
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('saves a new cadence as the schedule from the chosen session on', async () => {
		const { getByTestId, getByText } = await renderScreen();
		fireEvent.press(getByTestId('session-schedule.cadence'));
		fireEvent.press(getByTestId('session-schedule.cadence.weekly'));
		await act(async () => { fireEvent.press(getByText('Save')); });

		expect(mockSessions.replaceSchedule).toHaveBeenCalledWith({
			firstSessionAt: new Date(2026, 10, 12, 17, 0),
			cadence: 'weekly',
			durationMin: 50,
			revision: 7,
		});
		expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('saves a reminder time alone without replacing the schedule', async () => {
		const { getByTestId, getByText } = await renderScreen();
		fireEvent(getByTestId('session-schedule.morning'), 'change', { type: 'set' }, new Date(2026, 9, 28, 8, 15));
		await act(async () => { fireEvent.press(getByText('Save')); });

		expect(mockSessions.replaceSchedule).not.toHaveBeenCalled();
		expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ morningReminderMinutes: 495, eveningReminderMinutes: 1200 });
		expect(mockSessions.refreshReminderSchedule).toHaveBeenCalled();
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('stays open and says the calendar changed when the save is refused as stale', async () => {
		mockSessions.replaceSchedule.mockRejectedValueOnce(new ApiError(412, { message: 'changed' }));
		const { getByTestId, getByText } = await renderScreen();
		fireEvent.press(getByTestId('session-schedule.cadence'));
		fireEvent.press(getByTestId('session-schedule.cadence.monthly'));
		await act(async () => { fireEvent.press(getByText('Save')); });

		expect(mockShowAlert).toHaveBeenCalledWith('Calendar changed', expect.any(String));
		expect(mockBack).not.toHaveBeenCalled();
	});

	it('will not save a session time that has already passed', async () => {
		const { getByTestId, getByText } = await renderScreen();
		fireEvent(getByTestId('session-schedule.date'), 'change', { type: 'set' }, new Date(2026, 9, 28, 9, 0));
		fireEvent(getByTestId('session-schedule.time'), 'change', { type: 'set' }, new Date(2026, 9, 28, 9, 0));
		await act(async () => { fireEvent.press(getByText('Save')); });

		expect(getByText('Choose a future therapy session.')).not.toBeNull();
		expect(mockSessions.replaceSchedule).not.toHaveBeenCalled();
	});

	it('waits for the calendar before showing a schedule it could save', async () => {
		mockSessions.hydrated = false;
		const { queryByText } = await renderScreen();
		expect(queryByText('Save')).toBeNull();
	});

	it('seeds from the fresh calendar, not the cached one painted first', async () => {
		let answer: () => void = () => {};
		mockSessions.refreshSessions.mockImplementationOnce(() => new Promise<void>((resolve) => { answer = resolve; }));
		const { queryByText } = render(<SessionScheduleScreen />);
		expect(queryByText('Save')).toBeNull();

		await act(async () => { answer(); });
		expect(queryByText('Save')).not.toBeNull();
	});

	it('saves against the revision it showed, even after a newer one arrives', async () => {
		const view = await renderScreen();
		mockSessions.revision = 9;
		view.rerender(<SessionScheduleScreen />);
		chooseCadence(view, 'weekly');
		await act(async () => { fireEvent.press(view.getByText('Save')); });

		expect(mockSessions.replaceSchedule).toHaveBeenCalledWith(expect.objectContaining({ revision: 7 }));
	});

	it('shows the refreshed calendar after a save refused as stale', async () => {
		mockSessions.replaceSchedule.mockImplementationOnce(async () => {
			// The context refreshes before rethrowing: the calendar is weekly now.
			mockSessions = { ...mockSessions, revision: 9, series: [{ id: 'ser', cadence: 'weekly' }] };
			throw new ApiError(412, { message: 'changed' });
		});
		const view = await renderScreen();
		chooseCadence(view, 'monthly');
		await act(async () => { fireEvent.press(view.getByText('Save')); });

		expect(view.getByText('Every week')).not.toBeNull();
		chooseCadence(view, 'monthly');
		await act(async () => { fireEvent.press(view.getByText('Save')); });
		expect(mockSessions.replaceSchedule).toHaveBeenLastCalledWith(expect.objectContaining({ cadence: 'monthly', revision: 9 }));
	});

	it('writes the schedule again on a retry that changes it back after a half-failed save', async () => {
		mockUpdateCurrentUser.mockRejectedValueOnce(new Error('offline'));
		const view = await renderScreen();
		chooseCadence(view, 'monthly');
		fireEvent(view.getByTestId('session-schedule.morning'), 'change', { type: 'set' }, new Date(2026, 9, 28, 8, 15));
		await act(async () => { fireEvent.press(view.getByText('Save')); });
		expect(mockBack).not.toHaveBeenCalled();

		chooseCadence(view, 'fortnightly');
		await act(async () => { fireEvent.press(view.getByText('Save')); });

		expect(mockSessions.replaceSchedule).toHaveBeenCalledTimes(2);
		expect(mockSessions.replaceSchedule).toHaveBeenLastCalledWith(expect.objectContaining({ cadence: 'fortnightly', revision: 8 }));
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('saves reminder times alone when there is no session', async () => {
		mockSessions = { ...mockSessions, nextSession: null, series: [] };
		const view = await renderScreen();
		fireEvent(view.getByTestId('session-schedule.morning'), 'change', { type: 'set' }, new Date(2026, 9, 28, 8, 15));
		await act(async () => { fireEvent.press(view.getByText('Save')); });

		expect(mockSessions.replaceSchedule).not.toHaveBeenCalled();
		expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ morningReminderMinutes: 495, eveningReminderMinutes: 1200 });
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('changes how often for a session booked beyond six months, keeping its date', async () => {
		const farOff = new Date(2027, 5, 28, 17, 0);
		mockSessions.nextSession = { startsAtUtc: farOff.toISOString(), seriesId: 'ser', durationMin: 50 };
		const view = await renderScreen();
		chooseCadence(view, 'weekly');
		await act(async () => { fireEvent.press(view.getByText('Save')); });

		expect(view.queryByText('Choose a session within the next six months.')).toBeNull();
		expect(mockSessions.replaceSchedule).toHaveBeenCalledWith(expect.objectContaining({ firstSessionAt: farOff, cadence: 'weekly' }));
	});

	it('asks how often until there is a schedule, and cannot save without one', async () => {
		mockSessions = { ...mockSessions, nextSession: null, series: [], reminderScheduleSettings: null };
		const { getByText } = await renderScreen();

		expect(getByText('How often are your sessions?')).not.toBeNull();
		fireEvent.press(getByText('Save'));
		expect(mockBack).not.toHaveBeenCalled();
	});
});
