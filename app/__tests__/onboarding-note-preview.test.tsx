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
            bottomBackdrop,
        }: {
            headline: string;
            supporting?: string;
            children?: React.ReactNode;
            footer?: React.ReactNode;
            bottomBackdrop?: React.ReactNode;
        }) => ReactForMock.createElement(
            MockView,
            null,
            ReactForMock.createElement(MockText, null, headline),
            supporting === undefined ? null : ReactForMock.createElement(MockText, null, supporting),
            children,
            footer,
            bottomBackdrop,
        ),
    };
});

import NotePreviewScreen from '../(onboarding)/note-preview';
import { NOTE_PREVIEW_COPY } from '../../src/features/onboarding/onboardingCopy';

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

    it('keeps the encryption note above the notes image', () => {
        const { getByText, getByLabelText } = render(<NotePreviewScreen />);

        expect(getByText(NOTE_PREVIEW_COPY.privacyTitle)).toBeTruthy();
        expect(getByText(NOTE_PREVIEW_COPY.privacyBody)).toBeTruthy();
        expect(
            getByLabelText('A list of past therapy notes, each with the date of its session'),
        ).toBeTruthy();
    });

    it("shows Mark's words under the encryption note", () => {
        const { getByText } = render(<NotePreviewScreen />);

        expect(getByText(new RegExp('keeps me accountable'))).toBeTruthy();
        expect(getByText('Mark')).toBeTruthy();
    });

    it('carries no description under the headline', () => {
        const { queryByText } = render(<NotePreviewScreen />);

        expect(queryByText(/Your notes hold what came up/)).toBeNull();
    });

    it('renders the screenshot full width, undistorted, and in plain numbers', () => {
        const { Dimensions } = require('react-native');
        const { getByLabelText } = render(<NotePreviewScreen />);

        const image = getByLabelText('A list of past therapy notes, each with the date of its session');
        const flat = Object.assign({}, ...[image.props.style].flat());

        // Explicit numeric dimensions: a percentage width with an aspect
        // ratio left the image unconstrained on the new architecture, and it
        // rendered at its intrinsic 1290pt. Numbers cannot be misread.
        expect(typeof flat.width).toBe('number');
        expect(typeof flat.height).toBe('number');
        expect(flat.width).toBe(Dimensions.get('window').width);
        // Its own proportions, so nothing is stretched.
        expect(flat.width / flat.height).toBeCloseTo(1290 / 2616, 2);
        // A rounded card whose top edge is shown in full; the screen's bottom
        // edge is what cuts it, never its own frame.
        expect(flat.borderRadius).toBe(28);
        expect(flat.marginTop).toBeGreaterThan(0);
        expect(image.props.resizeMode).toBe('contain');
    });
});
