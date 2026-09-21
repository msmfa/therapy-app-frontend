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
import NoteTemplateScreen from '../(onboarding)/note-template';
import ReviewsPreviewScreen from '../(onboarding)/reviews-preview';
import ReviewScheduleScreen from '../(onboarding)/review-schedule';
import {
    evidenceParts,
    noteTemplateCopy,
    planCopy,
    reviewScheduleCopy,
    reviewsPreviewCopy,
} from '../../src/features/onboarding/onboardingCopy';

/** The rows' labels, built from the session date the fixtures use. */
const SESSION_ROW_LABEL = `After your ${dayjs(baseAnswers.sessionAt).format('dddd')} session`;
const POST_SESSION_LABEL = `Later that ${dayjs(baseAnswers.sessionAt).format('dddd')} evening`;
// The evening before the following session, which the fixtures put a week
// after the first.
const PRE_SESSION_LABEL = `${dayjs(baseAnswers.sessionAt).add(6, 'day').format('dddd')} evening`;

describe('the plan is split across four screens', () => {
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

    it('names the template in the paragraph without making it the way in', () => {
        const { getByText } = render(<PlanPreviewScreen />);

        // The template has its own screen now, reached by the button below.
        // Inside the paragraph the phrase is emphasis, not a second and easily
        // missed route to the same place.
        const phrase = getByText('5 minute, 5 questions template');
        expect(phrase.props.accessibilityRole).toBeUndefined();
        expect(phrase.props.onPress).toBeUndefined();
    });

    it('sends the plan preview on to the template', () => {
        const { getByLabelText } = render(<PlanPreviewScreen />);

        expect(planCopy().primaryCta).toBe('5 minute template');
        fireEvent.press(getByLabelText(planCopy().primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/note-template');
    });

    it('carries on from the template to the reminders', () => {
        const { getByLabelText } = render(<NoteTemplateScreen />);

        fireEvent.press(getByLabelText(noteTemplateCopy().primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/reviews-preview');
    });

    it('opens the readable cheatsheet when the sheet is pressed', () => {
        const { getByLabelText, queryByTestId, getByTestId } = render(<NoteTemplateScreen />);

        // The sheet on the page is a picture, tilted and run off the bottom
        // edge. The copy is readable in the popup the whole of it opens.
        expect(queryByTestId('template-help-modal-root')).toBeNull();

        fireEvent.press(getByLabelText(noteTemplateCopy().openSheet));

        expect(getByTestId('template-help-modal-root')).toBeTruthy();
        // Pressing the sheet must not also move the flow on.
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('prompts the reader to press it', () => {
        const { getByText } = render(<NoteTemplateScreen />);

        expect(getByText(noteTemplateCopy().tapHint)).toBeTruthy();
    });

    it('leads the reviews screen with the evidence line and nothing else', () => {
        const { getByText, queryByText } = render(<ReviewsPreviewScreen />);
        const { statement } = evidenceParts(baseAnswers.goal);

        expect(getByText(reviewsPreviewCopy().headline)).toBeTruthy();
        // The research and the goal they chose are one sentence, not two
        // paragraphs, so the reason the times are these times reads as one
        // answer.
        expect(statement).toContain(planCopy().evidenceStatement);
        expect(statement).toContain('what you told us matters most');
        // What happens either side of it: the note before, the list after.
        expect(getByText(reviewsPreviewCopy().intro)).toBeTruthy();
        expect(getByText(reviewsPreviewCopy().nextPage)).toBeTruthy();
        // The dated moments are a screen of their own now.
        expect(queryByText(POST_SESSION_LABEL)).toBeNull();
        expect(queryByText(PRE_SESSION_LABEL)).toBeNull();
    });

    it('sets the goal in bold inside the sentence that repeats it back', () => {
        const { getByText } = render(<ReviewsPreviewScreen />);
        const { priority } = evidenceParts(baseAnswers.goal);

        const marked = getByText(priority!);
        const style = Object.assign({}, ...[marked.props.style].flat(Infinity));
        expect(style.fontFamily).toBe('GeneralSans-Semibold');
        // Weight alone: a rule under a phrase this long read as a link.
        expect(style.textDecorationLine).toBeUndefined();
    });

    it('sends the reviews screen on to the schedule', () => {
        const { getByLabelText } = render(<ReviewsPreviewScreen />);

        fireEvent.press(getByLabelText(reviewsPreviewCopy().primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/review-schedule');
    });

    it('shows the remaining points on the schedule screen', () => {
        const { getByText, queryByText } = render(<ReviewScheduleScreen />);

        expect(getByText(POST_SESSION_LABEL)).toBeTruthy();
        expect(getByText(PRE_SESSION_LABEL)).toBeTruthy();
        // The note point stays behind on the plan screen.
        expect(queryByText(SESSION_ROW_LABEL)).toBeNull();
    });

    it('carries on to the note preview from the schedule screen', () => {
        const { getByLabelText } = render(<ReviewScheduleScreen />);

        fireEvent.press(getByLabelText(reviewScheduleCopy().primaryCta));

        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/note-preview');
    });

    it('titles each screen distinctly from its button', () => {
        expect(reviewsPreviewCopy().headline).not.toBe(reviewsPreviewCopy().primaryCta);
        expect(reviewScheduleCopy().headline).not.toBe(reviewScheduleCopy().primaryCta);
        expect(reviewScheduleCopy().primaryCta).toBe('Your notes');
    });
});

/**
 * Every review sits inside the gap between two sessions, which is how the
 * server schedules them too. Without a second session there is no gap, and the
 * screen used to render its title and one sentence over empty space.
 */
describe('the schedule screen when no gap can be worked out', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAnswers = { ...baseAnswers };
    });

    it('shows a labelled one-week example when the schedule varies', () => {
        mockAnswers = { ...baseAnswers, cadence: 'varies' };

        const { getByText } = render(<ReviewScheduleScreen />);

        expect(getByText(reviewScheduleCopy().exampleGapNote)).toBeTruthy();
        expect(getByText('Between sessions')).toBeTruthy();
        expect(getByText(PRE_SESSION_LABEL)).toBeTruthy();
    });

    it('shows the same example when the cadence was never answered', () => {
        mockAnswers = { ...baseAnswers, cadence: null };

        const { getByText } = render(<ReviewScheduleScreen />);

        expect(getByText(reviewScheduleCopy().exampleGapNote)).toBeTruthy();
        expect(getByText(PRE_SESSION_LABEL)).toBeTruthy();
    });

    it('says the dates are illustrative on a sample plan with a real cadence', () => {
        mockAnswers = {
            ...baseAnswers,
            sessionAt: null,
            sessionDateSkipped: true,
        };

        const { getByText } = render(<ReviewScheduleScreen />);

        expect(getByText(reviewScheduleCopy().sampleNote)).toBeTruthy();
    });

    it('claims nothing extra once a real gap is known', () => {
        const { queryByText } = render(<ReviewScheduleScreen />);

        expect(queryByText(reviewScheduleCopy().exampleGapNote)).toBeNull();
        expect(queryByText(reviewScheduleCopy().sampleNote)).toBeNull();
    });
});
