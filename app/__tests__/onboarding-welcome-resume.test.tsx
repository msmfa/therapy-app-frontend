import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import type { OnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

const mockPush = jest.fn();
const mockPeekPending = jest.fn<string | null, []>(() => null);
const mockConsumePending = jest.fn<string | null, []>(() => null);
let mockIsAuthenticated = false;
let mockHasOnboarded = false;
let mockOnboardingHydrated = true;
let mockUserId: string | null = null;
let mockAnswersHydrated = true;
let mockAnswers: OnboardingAnswers = {
    goal: null,
    sessionAt: null,
    sessionDateSkipped: false,
    cadence: null,
    morningMinutes: 450,
    eveningMinutes: 1200,
    plan: 'annual',
    entitlementConfirmedThisSession: false,
    reminderScheduled: false,
    resumeRoute: null,
};

jest.mock('expo-router', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return {
        Redirect: ({ href }: { href: string }) =>
            ReactForMock.createElement(MockText, null, `redirect:${href}`),
        useFocusEffect: (callback: () => void) => ReactForMock.useEffect(callback, [callback]),
        useRouter: () => ({ push: mockPush }),
    };
});

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: mockIsAuthenticated,
        user: mockUserId === null ? null : { id: mockUserId },
    }),
}));

jest.mock('../../src/context/onboarding/OnboardingContext', () => ({
    useOnboarding: () => ({ hasOnboarded: mockHasOnboarded, hydrated: mockOnboardingHydrated }),
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: mockAnswers,
        hydrated: mockAnswersHydrated,
    }),
}));

jest.mock('../../src/features/onboarding/authReturn', () => ({
    consumePendingOnboardingStep: () => mockConsumePending(),
    peekPendingOnboardingStep: () => mockPeekPending(),
}));

jest.mock('expo-image', () => ({ Image: () => null }));

jest.mock('../../src/components/ui/Loading', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return () => ReactForMock.createElement(MockText, null, 'loading');
});

jest.mock('../../src/components/ui/Button', () => {
    const ReactForMock = require('react');
    const { Text: MockText, TouchableOpacity: MockTouchableOpacity } = require('react-native');
    return {
        Button: ({ label, onPress }: { label: string; onPress: () => void }) =>
            ReactForMock.createElement(
                MockTouchableOpacity,
                { onPress },
                ReactForMock.createElement(MockText, null, label),
            ),
    };
});

import WelcomeScreen from '../(onboarding)';

describe('Welcome onboarding handoff', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsAuthenticated = false;
        mockHasOnboarded = false;
        mockOnboardingHydrated = true;
        mockUserId = null;
        mockAnswersHydrated = true;
        mockAnswers = {
            goal: null,
            sessionAt: null,
            sessionDateSkipped: false,
            cadence: null,
            morningMinutes: 450,
            eveningMinutes: 1200,
            plan: 'annual',
            entitlementConfirmedThisSession: false,
            reminderScheduled: false,
            resumeRoute: null,
        };
        mockPeekPending.mockReturnValue(null);
        mockConsumePending.mockReturnValue(null);
    });

    it('redirects through Welcome without consuming the action the target must resume', () => {
        mockIsAuthenticated = true;
        mockHasOnboarded = true;
        mockPeekPending.mockReturnValue('/(onboarding)/subscription-preview');

        const { getByText } = render(<WelcomeScreen />);

        expect(getByText('redirect:/(onboarding)/subscription-preview')).toBeTruthy();
        expect(mockPeekPending).toHaveBeenCalledTimes(1);
        expect(mockConsumePending).not.toHaveBeenCalled();
    });

    it('sends a completed account through normal routing instead of restarting its draft', () => {
        mockIsAuthenticated = true;
        mockHasOnboarded = true;
        mockAnswers.resumeRoute = '/(onboarding)/goal';
        const { getByText } = render(<WelcomeScreen />);
        expect(getByText('redirect:/(tabs)/notes')).toBeTruthy();
    });

    it('waits for the current account status before redirecting to protected tabs', () => {
        mockIsAuthenticated = true;
        mockHasOnboarded = true;
        mockOnboardingHydrated = false;
        const view = render(<WelcomeScreen />);
        expect(view.getByText('loading')).toBeTruthy();
        expect(view.queryByText('redirect:/(tabs)/notes')).toBeNull();

        mockOnboardingHydrated = true;
        view.rerender(<WelcomeScreen />);
        expect(view.getByText('redirect:/(tabs)/notes')).toBeTruthy();
    });

    it('clears an abandoned handoff before showing Welcome signed out', () => {
        mockConsumePending.mockReturnValue('/(onboarding)/subscription-preview');

        const { getByText } = render(<WelcomeScreen />);

        expect(getByText('Build my plan')).toBeTruthy();
        expect(mockConsumePending).toHaveBeenCalledTimes(1);
        expect(mockPeekPending).not.toHaveBeenCalled();
    });

    it('waits for the encrypted draft before showing the start of onboarding', () => {
        mockAnswersHydrated = false;

        const { getByText, queryByText } = render(<WelcomeScreen />);

        expect(getByText('loading')).toBeTruthy();
        expect(queryByText('Build my plan')).toBeNull();
    });

    it('resumes the last valid onboarding step after an app relaunch', async () => {
        mockAnswers = {
            ...mockAnswers,
            goal: 'remember',
            sessionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/plan-preview',
        };

        const { getByText } = render(<WelcomeScreen />);

        await waitFor(() => {
            expect(getByText('redirect:/(onboarding)/plan-preview')).toBeTruthy();
        });
    });

    it('stays on Welcome after backing out of the first question', async () => {
        mockAnswers = {
            ...mockAnswers,
            goal: 'remember',
            resumeRoute: '/(onboarding)/goal',
        };

        const { getByText, queryByText } = render(<WelcomeScreen />);

        await waitFor(() => expect(getByText('Build my plan')).toBeTruthy());
        expect(queryByText('redirect:/(onboarding)/goal')).toBeNull();
    });

    it('returns to session date when the saved appointment has passed', async () => {
        mockAnswers = {
            ...mockAnswers,
            goal: 'remember',
            sessionAt: new Date(Date.now() - 60_000),
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/plan-preview',
        };

        const { getByText } = render(<WelcomeScreen />);

        await waitFor(() => {
            expect(getByText('redirect:/(onboarding)/session-date')).toBeTruthy();
        });
    });

    it('makes a fresh resume decision after signing into a different draft owner', async () => {
        const view = render(<WelcomeScreen />);
        expect(view.getByText('Build my plan')).toBeTruthy();

        mockIsAuthenticated = true;
        mockUserId = 'user-a';
        mockAnswers = {
            ...mockAnswers,
            goal: 'remember',
            sessionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            cadence: 'weekly',
            resumeRoute: '/(onboarding)/reminder-times',
        };
        view.rerender(<WelcomeScreen />);

        await waitFor(() => {
            expect(view.getByText('redirect:/(onboarding)/reminder-times')).toBeTruthy();
        });
    });
});
