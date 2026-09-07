import React from 'react';
import dayjs from 'dayjs';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

const baseAnswers = {
    goal: 'remember' as const,
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

let mockAnswers: Record<string, unknown> = { ...baseAnswers };

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ answers: mockAnswers, setAnswer: jest.fn(), hydrated: true }),
}));

import PlanPreviewScreen from '../(onboarding)/plan-preview';
import ReviewsPreviewScreen from '../(onboarding)/reviews-preview';
import {
    evidenceStatement,
    PLAN_COPY,
    REVIEWS_PREVIEW_COPY,
} from '../../src/features/onboarding/onboardingCopy';

/** The rows' labels, built from the session date the fixtures use. */
const SESSION_ROW_LABEL = `After your ${dayjs(baseAnswers.sessionAt).format('dddd')} session`;
const POST_SESSION_LABEL = `Later that ${dayjs(baseAnswers.sessionAt).format('dddd')} evening`;
// The evening before the following session, which the fixtures put a week
// after the first.
const PRE_SESSION_LABEL = `${dayjs(baseAnswers.sessionAt).add(6, 'day').format('dddd')} evening`;

describe('the plan is split across two screens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAnswers = { ...baseAnswers };
    });

    it('leaves the plan preview showing only the note itself', () => {
        const { getByText, queryByText } = render(<PlanPreviewScreen />);

        // Named by the day the session falls on, so the row says something the
        // screen's own heading has not already said.
        expect(getByText(SESSION_ROW_LABEL)).toBeTruthy();
        expect(SESSION_ROW_LABEL).toBe('After your Monday session');
        // Everything the app does afterwards has moved on.
        expect(queryByText(POST_SESSION_LABEL)).toBeNull();
    });

    it('leads the reviews screen with the evidence line', () => {
        const { getByText } = render(<ReviewsPreviewScreen />);

        expect(getByText(REVIEWS_PREVIEW_COPY.headline)).toBeTruthy();
        // Both halves of the answer: the research, and the goal they chose.
        expect(getByText(evidenceStatement(baseAnswers.goal))).toBeTruthy();
        expect(evidenceStatement(baseAnswers.goal)).toContain(PLAN_COPY.evidenceStatement);
        expect(evidenceStatement(baseAnswers.goal)).toContain('what you told us matters most');
    });

    it('makes the template\'s own name the way into its explanation', () => {
        const { getByText, queryByText } = render(<PlanPreviewScreen />);

        // The words naming the template are the link. A separate line under
        // the card saying the same thing has gone.
        const link = getByText('5 minute, 5 questions template');
        expect(link.props.accessibilityRole).toBe('link');
        expect(link.props.onPress).toBeDefined();
        expect(queryByText('Why these five questions?')).toBeNull();
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

        expect(getByText(POST_SESSION_LABEL)).toBeTruthy();
        // The note point stays behind on the previous screen.
        expect(queryByText(SESSION_ROW_LABEL)).toBeNull();
        expect(getByLabelText(REVIEWS_PREVIEW_COPY.primaryCta)).toBeTruthy();
    });

    it('titles the reviews screen distinctly from its button', () => {
        expect(REVIEWS_PREVIEW_COPY.headline).not.toBe(REVIEWS_PREVIEW_COPY.primaryCta);
        expect(REVIEWS_PREVIEW_COPY.primaryCta).toBe('Your notes');
    });
});

/**
 * Every review sits inside the gap between two sessions, which is how the
 * server schedules them too. Without a second session there is no gap, and the
 * screen used to render its title and one sentence over empty space.
 */
describe('the reviews screen when no gap can be worked out', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAnswers = { ...baseAnswers };
    });

    it('shows a labelled one-week example when the schedule varies', () => {
        mockAnswers = { ...baseAnswers, cadence: 'varies' };

        const { getByText } = render(<ReviewsPreviewScreen />);

        expect(getByText(REVIEWS_PREVIEW_COPY.exampleGapNote)).toBeTruthy();
        expect(getByText('Between sessions')).toBeTruthy();
        expect(getByText(PRE_SESSION_LABEL)).toBeTruthy();
    });

    it('shows the same example when the cadence was never answered', () => {
        mockAnswers = { ...baseAnswers, cadence: null };

        const { getByText } = render(<ReviewsPreviewScreen />);

        expect(getByText(REVIEWS_PREVIEW_COPY.exampleGapNote)).toBeTruthy();
        expect(getByText(PRE_SESSION_LABEL)).toBeTruthy();
    });

    it('says the dates are illustrative on a sample plan with a real cadence', () => {
        mockAnswers = {
            ...baseAnswers,
            sessionAt: null,
            sessionDateSkipped: true,
        };

        const { getByText } = render(<ReviewsPreviewScreen />);

        expect(getByText(REVIEWS_PREVIEW_COPY.sampleNote)).toBeTruthy();
    });

    it('claims nothing extra once a real gap is known', () => {
        const { queryByText } = render(<ReviewsPreviewScreen />);

        expect(queryByText(REVIEWS_PREVIEW_COPY.exampleGapNote)).toBeNull();
        expect(queryByText(REVIEWS_PREVIEW_COPY.sampleNote)).toBeNull();
    });
});
