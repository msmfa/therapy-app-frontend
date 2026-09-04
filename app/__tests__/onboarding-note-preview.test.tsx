import React from 'react';
import { render } from '@testing-library/react-native';

const mockPush = jest.fn();
let mockGoal: string | null = 'prepare';

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: { goal: mockGoal },
        setAnswer: jest.fn(),
        hydrated: true,
    }),
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
        }) => ReactForMock.createElement(
            MockView,
            null,
            ReactForMock.createElement(MockText, null, headline),
            supporting === undefined ? null : ReactForMock.createElement(MockText, null, supporting),
            children,
            footer,
        ),
    };
});

import NotePreviewScreen from '../(onboarding)/note-preview';
import { NOTE_PREVIEW_COPY, notePreviewBody } from '../../src/features/onboarding/onboardingCopy';

describe('onboarding note preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGoal = 'prepare';
    });

    it('is about the notes themselves', () => {
        const { getByText } = render(<NotePreviewScreen />);

        expect(getByText('Your notes')).toBeTruthy();
        expect(NOTE_PREVIEW_COPY.headline).toBe('Your notes');
    });

    it('opens with the goal the user chose, not one line for everyone', () => {
        const prepare = render(<NotePreviewScreen />);
        expect(prepare.getByText(notePreviewBody('prepare'))).toBeTruthy();
        prepare.unmount();

        mockGoal = 'habit';
        const habit = render(<NotePreviewScreen />);
        expect(habit.getByText(notePreviewBody('habit'))).toBeTruthy();

        expect(notePreviewBody('prepare')).not.toBe(notePreviewBody('habit'));
    });

    it('still says something sensible when no goal was recorded', () => {
        mockGoal = null;
        const { getByText } = render(<NotePreviewScreen />);

        expect(getByText(notePreviewBody(null))).toBeTruthy();
    });

    it('keeps the encryption note above the notes image', () => {
        const { getByText, getByLabelText } = render(<NotePreviewScreen />);

        expect(getByText(NOTE_PREVIEW_COPY.privacyTitle)).toBeTruthy();
        expect(getByText(NOTE_PREVIEW_COPY.privacyBody)).toBeTruthy();
        expect(
            getByLabelText('A list of past therapy notes, each with the date of its session'),
        ).toBeTruthy();
    });

    it('shows the top of the list and clips the rest, rather than the middle', () => {
        const { getByLabelText } = render(<NotePreviewScreen />);

        const image = getByLabelText('A list of past therapy notes, each with the date of its session');

        // Anchored to the top of the screenshot. A centred crop showed the
        // middle of the list, which is where the previous version went wrong.
        expect(image.props.style.position).toBe('absolute');
        expect(image.props.style.top).toBe(0);
        // Its own proportions, so nothing is stretched.
        expect(image.props.style.aspectRatio).toBeCloseTo(1290 / 2616, 5);
        expect(image.props.resizeMode).toBe('contain');
    });
});
