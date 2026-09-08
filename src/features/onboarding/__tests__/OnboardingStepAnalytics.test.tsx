import React, { useEffect, useState } from 'react';
import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { OnboardingStepAnalytics } from '../OnboardingStepAnalytics';

const mockCapture = jest.fn();
let mockFocused = true;
let mockSnapshot = { enabled: true };
let mockGeneration = 0;
const mockSubscribers = new Set<() => void>();

jest.mock('expo-router', () => ({
    useFocusEffect: (effect: () => void) => {
        const ReactForMock = require('react');
        ReactForMock.useEffect(() => mockFocused ? effect() : undefined, [effect, mockFocused]);
    },
}));

jest.mock('../../analytics/client', () => ({
    analytics: {
        subscribe: (listener: () => void) => {
            mockSubscribers.add(listener);
            return () => mockSubscribers.delete(listener);
        },
        getSnapshot: () => mockSnapshot,
        getVisitId: () => 'visit',
        beginOperation: () => {
            const generation = mockGeneration;
            return { capture: (...args: unknown[]) => {
                if (generation === mockGeneration) mockCapture(...args);
            } };
        },
    },
}));

describe('visible onboarding step analytics', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockFocused = true;
        mockSnapshot = { enabled: true };
        mockGeneration = 0;
    });

    afterEach(() => jest.useRealTimers());

    it('uses the same local dedupe key after remounting a step on the same visit', () => {
        const first = render(<OnboardingStepAnalytics step="goal" />);
        act(() => jest.runOnlyPendingTimers());
        first.unmount();
        render(<OnboardingStepAnalytics step="goal" />);
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture.mock.calls).toEqual([0, 1].map(() => [
            'onboarding_step_viewed', { step: 'goal', flow_version: '1' },
            { dedupeKey: 'onboarding-step:visit:1:goal' },
        ]));
    });

    it('does not count a screen that immediately redirects from its focus effect', () => {
        function ResumeRedirect() {
            const [redirected, setRedirected] = useState(false);
            useEffect(() => setRedirected(true), []);
            return redirected ? <Text>Redirect</Text> : <OnboardingStepAnalytics step="welcome" />;
        }
        render(<ResumeRedirect />);
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture).not.toHaveBeenCalled();
    });

    it('records the visible step after consent is enabled, but never an unfocused screen', () => {
        mockSnapshot = { enabled: false };
        const screen = render(<OnboardingStepAnalytics step="welcome" />);
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture).not.toHaveBeenCalled();
        act(() => {
            mockSnapshot = { enabled: true };
            mockSubscribers.forEach((listener) => listener());
        });
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture).toHaveBeenCalledTimes(1);
        mockFocused = false;
        screen.rerender(<OnboardingStepAnalytics step="goal" />);
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture).toHaveBeenCalledTimes(1);
    });

    it('drops a queued view when the account changes before delivery', () => {
        render(<OnboardingStepAnalytics step="success" />);
        mockGeneration += 1;
        act(() => jest.runOnlyPendingTimers());
        expect(mockCapture).not.toHaveBeenCalled();
    });
});
