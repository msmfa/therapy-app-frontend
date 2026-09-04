import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockFinishOnboarding = jest.fn();
const mockAddSessions = jest.fn();
const mockDiscardDraft = jest.fn();
const mockUpdateCurrentUser = jest.fn();
const mockRefreshReminderSchedule = jest.fn();
const mockShowAlert = jest.fn();

let mockSessionAt = new Date();
let mockGoal: 'remember' | null = 'remember';
let mockCadence: 'weekly' | null = 'weekly';
let mockEntitlementConfirmed = true;
let mockSamplePlan = false;

jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace }),
	Redirect: ({ href }: { href: string }) => {
		const ReactForMock = require('react');
		const { Text: MockText } = require('react-native');
		return ReactForMock.createElement(MockText, null, `redirect:${href}`);
	},
}));

jest.mock('../../src/context/onboarding/OnboardingContext', () => {
	const actual = jest.requireActual('../../src/context/onboarding/OnboardingContext');
	return {
		...actual,
		useOnboarding: () => ({ finishOnboarding: mockFinishOnboarding }),
	};
});

jest.mock('../../src/context/therapy-sessions/TherapySessionsContext', () => ({
	useTherapySessions: () => ({
		addSessions: mockAddSessions,
		refreshReminderSchedule: mockRefreshReminderSchedule,
	}),
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
	useOnboardingAnswers: () => ({
		answers: {
			goal: mockGoal,
			sessionAt: mockSamplePlan ? null : mockSessionAt,
			sessionDateSkipped: mockSamplePlan,
			cadence: mockCadence,
			morningMinutes: 405,
			eveningMinutes: 1305,
			plan: 'annual',
			entitlementConfirmedThisSession: mockEntitlementConfirmed,
			reminderScheduled: true,
		},
		discardDraft: mockDiscardDraft,
	}),
}));

jest.mock('../../src/api/users', () => ({
	updateCurrentUser: (...args: unknown[]) => mockUpdateCurrentUser(...args),
}));

jest.mock('../../src/context/alert', () => ({
	useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
	const ReactForMock = require('react');
	const { Text: MockText, View: MockView } = require('react-native');
	return {
		OnboardingScreen: ({
			headline,
			supporting,
			footer,
		}: {
			headline: string;
			supporting?: string;
			footer?: React.ReactNode;
		}) =>
			ReactForMock.createElement(
				MockView,
				null,
				ReactForMock.createElement(MockText, null, headline),
				ReactForMock.createElement(MockText, null, supporting),
				footer,
			),
	};
});

import SuccessScreen from '../(onboarding)/success';

describe('onboarding completion', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGoal = 'remember';
		mockCadence = 'weekly';
		mockEntitlementConfirmed = true;
		mockSamplePlan = false;
		mockSessionAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		mockSessionAt.setHours(17, 0, 0, 0);
		mockAddSessions.mockResolvedValue(undefined);
		mockUpdateCurrentUser.mockResolvedValue(undefined);
		mockRefreshReminderSchedule.mockResolvedValue(undefined);
		mockFinishOnboarding.mockResolvedValue(undefined);
		mockDiscardDraft.mockResolvedValue(undefined);
	});

	it('saves sample-plan preferences without creating an illustrative session', async () => {
		mockSamplePlan = true;

		const { getByText } = render(<SuccessScreen />);
		expect(getByText('Your sample plan is ready')).toBeTruthy();
		fireEvent.press(getByText('Save and add my session'));

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/calendar'));
		expect(mockAddSessions).not.toHaveBeenCalled();
		expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
			morningReminderMinutes: 405,
			eveningReminderMinutes: 1305,
			reflectionGoal: 'remember',
		});
		expect(mockFinishOnboarding).toHaveBeenCalledTimes(1);
	});

	it('saves sessions and reminder choices before completing and clearing the draft', async () => {
		const { getByText } = render(<SuccessScreen />);
		fireEvent.press(getByText('Save and see my plan'));

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/calendar'));

		const projected = mockAddSessions.mock.calls[0][0] as Date[];
		expect(projected[0]).toEqual(mockSessionAt);
		expect(projected.length).toBeGreaterThan(1);
		expect(mockAddSessions).toHaveBeenCalledWith(projected, 50);
		expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
			morningReminderMinutes: 405,
			eveningReminderMinutes: 1305,
			reflectionGoal: 'remember',
		});
		expect(mockRefreshReminderSchedule).toHaveBeenCalledTimes(1);

		expect(mockAddSessions.mock.invocationCallOrder[0]).toBeLessThan(
			mockUpdateCurrentUser.mock.invocationCallOrder[0],
		);
		expect(mockUpdateCurrentUser.mock.invocationCallOrder[0]).toBeLessThan(
			mockRefreshReminderSchedule.mock.invocationCallOrder[0],
		);
		expect(mockRefreshReminderSchedule.mock.invocationCallOrder[0]).toBeLessThan(
			mockFinishOnboarding.mock.invocationCallOrder[0],
		);
		expect(mockFinishOnboarding.mock.invocationCallOrder[0]).toBeLessThan(
			mockDiscardDraft.mock.invocationCallOrder[0],
		);
		expect(mockDiscardDraft.mock.invocationCallOrder[0]).toBeLessThan(
			mockReplace.mock.invocationCallOrder[0],
		);
	});

	it('keeps the draft and onboarding state when the schedule cannot be saved', async () => {
		mockAddSessions.mockRejectedValue(new Error('offline'));

		const { getByText } = render(<SuccessScreen />);
		fireEvent.press(getByText('Save and see my plan'));

		await waitFor(() =>
			expect(mockShowAlert).toHaveBeenCalledWith(
				"We couldn't save your plan",
				'Your answers are still here. Please try again.',
			),
		);

		expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
		expect(mockRefreshReminderSchedule).not.toHaveBeenCalled();
		expect(mockFinishOnboarding).not.toHaveBeenCalled();
		expect(mockDiscardDraft).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('keeps onboarding resumable when reminder preferences cannot be saved', async () => {
		mockUpdateCurrentUser.mockRejectedValueOnce(new Error('offline'));

		const { getByText } = render(<SuccessScreen />);
		fireEvent.press(getByText('Save and see my plan'));

		await waitFor(() =>
			expect(mockShowAlert).toHaveBeenCalledWith(
				"We couldn't save your plan",
				'Your answers are still here. Please try again.',
			),
		);

		expect(mockAddSessions).toHaveBeenCalledTimes(1);
		expect(mockRefreshReminderSchedule).not.toHaveBeenCalled();
		expect(mockFinishOnboarding).not.toHaveBeenCalled();
		expect(mockDiscardDraft).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();

		// A retry replays the idempotent session union and then finishes the
		// remaining writes instead of leaving a half-onboarded account.
		fireEvent.press(getByText('Save and see my plan'));
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/calendar'));
		expect(mockAddSessions).toHaveBeenCalledTimes(2);
		expect(mockUpdateCurrentUser).toHaveBeenCalledTimes(2);
		expect(mockFinishOnboarding).toHaveBeenCalledTimes(1);
		expect(mockDiscardDraft).toHaveBeenCalledTimes(1);
	});

	it('does not clear answers when saving the completion flag fails', async () => {
		mockFinishOnboarding.mockRejectedValueOnce(new Error('storage failed'));

		const { getByText } = render(<SuccessScreen />);
		fireEvent.press(getByText('Save and see my plan'));

		await waitFor(() =>
			expect(mockShowAlert).toHaveBeenCalledWith(
				"We couldn't save your plan",
				'Your answers are still here. Please try again.',
			),
		);

		expect(mockAddSessions).toHaveBeenCalledTimes(1);
		expect(mockUpdateCurrentUser).toHaveBeenCalledTimes(1);
		expect(mockRefreshReminderSchedule).toHaveBeenCalledTimes(1);
		expect(mockDiscardDraft).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('cannot complete through a deep link that skipped required answers', () => {
		mockCadence = null;

		const { getByText, queryByText } = render(<SuccessScreen />);

		expect(getByText('redirect:/(onboarding)/session-cadence')).toBeTruthy();
		expect(queryByText('Save and see my plan')).toBeNull();
		expect(mockFinishOnboarding).not.toHaveBeenCalled();
	});

	it('cannot complete through a deep link that skipped the paywall', () => {
		mockEntitlementConfirmed = false;

		const { getByText, queryByText } = render(<SuccessScreen />);

		expect(getByText('redirect:/(onboarding)/subscription-preview')).toBeTruthy();
		expect(queryByText('Save and see my plan')).toBeNull();
		expect(mockFinishOnboarding).not.toHaveBeenCalled();
	});
});
