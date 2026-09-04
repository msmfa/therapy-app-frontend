import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockSetAnswer = jest.fn();
const mockReadPermission = jest.fn();
const mockRequestPermission = jest.fn();
const mockCancelLegacyReminder = jest.fn();
const mockEnsurePushRegistration = jest.fn();
const mockShowAlert = jest.fn();

let mockSessionAt = new Date();
let mockEveningMinutes = 20 * 60;
let mockSamplePlan = false;

jest.mock('expo-router', () => {
	const ReactForMock = require('react');
	const { Text: MockText } = require('react-native');
	return {
		useRouter: () => ({ push: mockPush }),
		Redirect: ({ href }: { href: string }) =>
			ReactForMock.createElement(MockText, null, `redirect:${href}`),
	};
});

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
	useOnboardingAnswers: () => ({
		answers: {
			goal: 'remember',
			sessionAt: mockSamplePlan ? null : mockSessionAt,
			sessionDateSkipped: mockSamplePlan,
			cadence: 'weekly',
			morningMinutes: 450,
			eveningMinutes: mockEveningMinutes,
			plan: 'annual',
			entitlementConfirmedThisSession: true,
			reminderScheduled: false,
		},
		setAnswer: mockSetAnswer,
	}),
}));

jest.mock('../../src/features/onboarding/onboardingNotifications', () => ({
	readNotificationPermission: (...args: unknown[]) => mockReadPermission(...args),
	requestNotificationPermission: (...args: unknown[]) => mockRequestPermission(...args),
	cancelOnboardingReminder: (...args: unknown[]) => mockCancelLegacyReminder(...args),
}));

jest.mock('../../src/services/notifications/pushRegistration', () => ({
	ensurePushRegistration: (...args: unknown[]) => mockEnsurePushRegistration(...args),
}));

jest.mock('../../src/context/alert', () => ({
	useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/features/onboarding/authReturn', () => ({
	setPendingOnboardingStep: jest.fn(),
}));

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
	const ReactForMock = require('react');
	const { Text: MockText, View: MockView } = require('react-native');
	return {
		OnboardingScreen: ({
			headline,
			supporting,
			children,
			footer,
		}: {
			headline: string;
			supporting?: string;
			children?: React.ReactNode;
			footer?: React.ReactNode;
		}) =>
			ReactForMock.createElement(
				MockView,
				null,
				ReactForMock.createElement(MockText, null, headline),
				ReactForMock.createElement(MockText, null, supporting),
				children,
				footer,
			),
	};
});

jest.mock('@expo/vector-icons', () => ({
	Feather: () => null,
}));

import NotificationsPreviewScreen from '../(onboarding)/notifications-preview';
import { postSessionNoteAt } from '../../src/features/onboarding/planTimeline';
import { notificationsHeadline } from '../../src/features/onboarding/onboardingCopy';
import { timeLabel, weekdayName } from '../../src/features/onboarding/formatting';

describe('onboarding notification handoff', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSessionAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		mockSessionAt.setHours(17, 0, 0, 0);
		mockEveningMinutes = 20 * 60;
		mockSamplePlan = false;
		mockReadPermission.mockResolvedValue({ granted: false, canAskAgain: true });
		mockRequestPermission.mockResolvedValue({ granted: true, canAskAgain: true });
		mockCancelLegacyReminder.mockResolvedValue(undefined);
		mockEnsurePushRegistration.mockResolvedValue({
			status: 'registered',
			token: 'ExponentPushToken[test]',
		});
	});

	it('does not request notification access for illustrative sample dates', async () => {
		mockSamplePlan = true;

		const { getByText } = render(<NotificationsPreviewScreen />);

		expect(getByText('redirect:/(onboarding)/success')).toBeTruthy();
		await waitFor(() => expect(mockReadPermission).not.toHaveBeenCalled());
		expect(mockRequestPermission).not.toHaveBeenCalled();
	});

	it('shows the note prompt after the session, independently of the evening reflection time', async () => {
		const firstReminder = postSessionNoteAt(mockSessionAt);
		const expected = notificationsHeadline(
			weekdayName(firstReminder),
			timeLabel(firstReminder),
		);

		const { getByText } = render(<NotificationsPreviewScreen />);

		await waitFor(() => expect(getByText(expected)).not.toBeNull());
		expect(firstReminder.getHours()).toBe(18);
		expect(expected).not.toContain(
			timeLabel(
				new Date(
					mockSessionAt.getFullYear(),
					mockSessionAt.getMonth(),
					mockSessionAt.getDate(),
					20,
					0,
				),
			),
		);
	});

	it('registers the device immediately when the user turns reminders on', async () => {
		const { getByText } = render(<NotificationsPreviewScreen />);
		await waitFor(() => expect(getByText('Turn on notifications')).not.toBeNull());

		fireEvent.press(getByText('Turn on notifications'));

		await waitFor(() => {
			expect(mockRequestPermission).toHaveBeenCalledTimes(1);
			expect(mockCancelLegacyReminder).toHaveBeenCalledTimes(1);
			expect(mockEnsurePushRegistration).toHaveBeenCalledTimes(1);
			expect(mockSetAnswer).toHaveBeenCalledWith('reminderScheduled', true);
			expect(mockPush).toHaveBeenCalledWith('/(onboarding)/success');
		});
	});

	it('keeps the user on the reminder step so failed registration can be retried', async () => {
		mockEnsurePushRegistration.mockResolvedValue({ status: 'failed' });
		const { getByText } = render(<NotificationsPreviewScreen />);
		await waitFor(() => expect(getByText('Turn on notifications')).not.toBeNull());

		fireEvent.press(getByText('Turn on notifications'));

		await waitFor(() => {
			expect(mockSetAnswer).toHaveBeenCalledWith('reminderScheduled', false);
			expect(mockShowAlert).toHaveBeenCalledWith(
				"We couldn't turn on notifications",
				'Check your connection and try again, or choose Not now.',
			);
			expect(getByText('Turn on notifications')).toBeTruthy();
		});
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('does not start notification setup twice on a double tap', async () => {
		let resolvePermission:
			| ((value: { granted: boolean; canAskAgain: boolean }) => void)
			| undefined;
		mockRequestPermission.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePermission = resolve;
				}),
		);

		const { getByText } = render(<NotificationsPreviewScreen />);
		await waitFor(() => expect(getByText('Turn on notifications')).toBeTruthy());
		const button = getByText('Turn on notifications');

		fireEvent.press(button);
		fireEvent.press(button);
		expect(mockRequestPermission).toHaveBeenCalledTimes(1);

		resolvePermission?.({ granted: true, canAskAgain: true });
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/(onboarding)/success');
		});
	});

	it('shows the Settings recovery screen when the system prompt is denied', async () => {
		mockRequestPermission.mockResolvedValue({ granted: false, canAskAgain: false });

		const { getByText } = render(<NotificationsPreviewScreen />);
		await waitFor(() => expect(getByText('Turn on notifications')).toBeTruthy());

		fireEvent.press(getByText('Turn on notifications'));

		await waitFor(() => {
			expect(getByText('Open Settings')).toBeTruthy();
			expect(mockSetAnswer).toHaveBeenCalledWith('reminderScheduled', false);
		});
		expect(mockEnsurePushRegistration).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});
});
