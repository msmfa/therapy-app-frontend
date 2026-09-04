import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

const mockAnswers = {
    goal: 'remember',
    sessionAt: new Date(2026, 8, 14, 18, 0, 0, 0),
    sessionDateSkipped: false,
    cadence: 'weekly',
    morningMinutes: 7 * 60 + 30,
    eveningMinutes: 20 * 60,
    plan: 'annual',
    entitlementConfirmedThisSession: false,
    reminderScheduled: false,
    resumeRoute: null,
};

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ answers: mockAnswers, setAnswer: jest.fn(), hydrated: true }),
}));

import PlanPreviewScreen from '../(onboarding)/plan-preview';
import ReviewsPreviewScreen from '../(onboarding)/reviews-preview';
import { REVIEWS_PREVIEW_COPY, PLAN_COPY } from '../../src/features/onboarding/onboardingCopy';

describe('the plan is split across two screens', () => {
    beforeEach(() => jest.clearAllMocks());

    it('leaves the plan preview showing only the note itself', () => {
        const { getByText, queryByText } = render(<PlanPreviewScreen />);

        expect(getByText('After your session')).toBeTruthy();
        // Everything the app does afterwards has moved on.
        expect(queryByText('Later that evening')).toBeNull();
    });

    it('leads the reviews screen with the evidence line', () => {
        const { getByText } = render(<ReviewsPreviewScreen />);

        expect(getByText(REVIEWS_PREVIEW_COPY.headline)).toBeTruthy();
        expect(REVIEWS_PREVIEW_COPY.headline).toBe('Why these times?');
        expect(getByText(PLAN_COPY.evidenceStatement)).toBeTruthy();
    });

    it('shows the five-minute note under the point it belongs to', () => {
        const { getByLabelText } = render(<PlanPreviewScreen />);

        // The link explaining the questions travels with the sheet.
        expect(getByLabelText('Why these five questions?')).toBeTruthy();
    });

    it('no longer carries a testimonial on the plan preview', () => {
        const { queryByText } = render(<PlanPreviewScreen />);

        expect(
            queryByText(/I love that I can look over my notes from previous sessions/),
        ).toBeNull();
    });

    it('sends the plan preview on to the reviews screen', () => {
        const { getByLabelText } = render(<PlanPreviewScreen />);

        fireEvent.press(getByLabelText(PLAN_COPY.primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/reviews-preview');
    });

    it('carries on to the note preview from the reviews screen', () => {
        const { getByLabelText } = render(<ReviewsPreviewScreen />);

        fireEvent.press(getByLabelText(REVIEWS_PREVIEW_COPY.primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/note-preview');
    });

    it('shows the remaining points on the reviews screen, with its own button', () => {
        const { getByText, queryByText, getByLabelText } = render(<ReviewsPreviewScreen />);

        expect(getByText('Later that evening')).toBeTruthy();
        // The note point stays behind on the previous screen.
        expect(queryByText('After your session')).toBeNull();
        expect(getByLabelText(REVIEWS_PREVIEW_COPY.primaryCta)).toBeTruthy();
    });

    it('titles the reviews screen distinctly from its button', () => {
        expect(REVIEWS_PREVIEW_COPY.headline).not.toBe(REVIEWS_PREVIEW_COPY.primaryCta);
        expect(REVIEWS_PREVIEW_COPY.primaryCta).toBe('Your notes');
    });
});
