import React from 'react';
import { render } from '@testing-library/react-native';

const mockPush = jest.fn();
let mockGoal: string | null = 'prepare';
let mockSessionAt: Date | null = new Date(2026, 8, 14, 18, 0, 0, 0);
let mockCadence: string | null = 'weekly';

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
}));

jest.mock('@react-navigation/native', () => ({
    useIsFocused: () => true,
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: {
            goal: mockGoal,
            sessionAt: mockSessionAt,
            cadence: mockCadence,
        },
        setAnswer: jest.fn(),
        hydrated: true,
    }),
}));

/** A stand-in for the measured bottom of the body content. */
const MOCK_CONTENT_BOTTOM = 400;

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
    const ReactForMock = require('react');
    const { Text: MockText, View: MockView } = require('react-native');
    return {
        // The screen reads this to decide the footer's ink, so the mock has to
        // carry it too.
        shouldUseCombinedOnboardingScroll: (fontScale: number) => fontScale >= 1.5,
        OnboardingScreen: ({
            headline,
            supporting,
            children,
            footer,
            bottomBackdrop,
            surface,
        }: {
            headline: string;
            supporting?: string;
            children?: React.ReactNode;
            footer?: React.ReactNode;
            // The backdrop is handed where the body content ends, so the
            // artwork can sit under the last card whatever its height.
            bottomBackdrop?: React.ReactNode | ((contentBottom: number) => React.ReactNode);
            surface?: string;
        }) => ReactForMock.createElement(
            MockView,
            { testID: 'onboarding-screen', accessibilityHint: surface },
            ReactForMock.createElement(MockText, null, headline),
            supporting === undefined ? null : ReactForMock.createElement(MockText, null, supporting),
            children,
            footer,
            ReactForMock.createElement(
                MockView,
                { testID: 'note-backdrop' },
                typeof bottomBackdrop === 'function' ? bottomBackdrop(MOCK_CONTENT_BOTTOM) : bottomBackdrop,
            ),
        ),
    };
});

import NotePreviewScreen from '../(onboarding)/note-preview';
import { GOAL_OPTIONS, NOTE_PREVIEW_COPY } from '../../src/features/onboarding/onboardingCopy';

describe('onboarding note preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGoal = 'prepare';
        mockSessionAt = new Date(2026, 8, 14, 18, 0, 0, 0);
        mockCadence = 'weekly';
    });

    it('is about the notes themselves', () => {
        const { getByText } = render(<NotePreviewScreen />);

        expect(getByText('Your notes')).toBeTruthy();
        expect(NOTE_PREVIEW_COPY.headline).toBe('Your notes');
    });

    it('keeps the encryption note above the notes image', () => {
        mockGoal = 'practise';
        const { getByText, getByLabelText } = render(<NotePreviewScreen />);

        expect(getByText(NOTE_PREVIEW_COPY.privacyTitle)).toBeTruthy();
        expect(getByText(NOTE_PREVIEW_COPY.privacyBody)).toBeTruthy();
        expect(
            getByLabelText('A list of past therapy notes, each with the date of its session'),
        ).toBeTruthy();
    });

    it('carries no testimonial; Mark now lives on the reminder times screen', () => {
        const { queryByText } = render(<NotePreviewScreen />);

        expect(queryByText(/keeps me accountable/)).toBeNull();
    });

    it('carries no description under the headline', () => {
        const { queryByText } = render(<NotePreviewScreen />);

        expect(queryByText(/Your notes hold what came up/)).toBeNull();
    });

    it('sits on the accent surface, so the pale screenshot reads as a screen on it', () => {
        const { getByTestId } = render(<NotePreviewScreen />);

        expect(getByTestId('onboarding-screen').props.accessibilityHint).toBe('accent');
    });

    it('renders the screenshot full width, undistorted, and in plain numbers', () => {
        mockGoal = 'practise';
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
        expect(flat.width / flat.height).toBeCloseTo(1290 / 2194, 2);
        // A rounded card whose top edge is shown in full; the screen's bottom
        // edge is what cuts it, never its own frame.
        expect(flat.borderRadius).toBe(28);
        // Under the content, not at a fraction of the screen: the cards are
        // sized by their text, so only their real bottom edge places this.
        expect(flat.marginTop).toBeGreaterThan(MOCK_CONTENT_BOTTOM);
        // expo-image, which is what decodes the WebP; React Native's own Image
        // cannot on iOS, and the artwork is a third of the size as WebP.
        expect(image.props.contentFit).toBe('contain');
    });

    it('says the chosen goal back, with what the notes do for it', () => {
        const { getByText } = render(<NotePreviewScreen />);

        const goal = GOAL_OPTIONS.find((option) => option.id === 'prepare')!;
        // Said back in the second person: the option is worded as the user
        // choosing it, which is wrong once the app is repeating it to them.
        expect(getByText(goal.restated)).toBeTruthy();
        expect(goal.restated).toContain('your next session');
        expect(getByText(goal.noteSupport)).toBeTruthy();
    });

    it('lands the reminder over the list when the goal is the next session', () => {
        const { Dimensions } = require('react-native');
        const { getByLabelText, getByText, getByTestId } = render(<NotePreviewScreen />);
        const { LinearGradient } = require('expo-linear-gradient');

        // The notification that starts it, and the list it arrives over.
        const banner = getByLabelText(
            "An iPhone notification from Plastic Brains: Review your notes before tomorrow's session",
        );
        expect(getByText("Review your notes before tomorrow's session")).toBeTruthy();
        expect(getByLabelText('A list of past therapy notes, each with the date of its session')).toBeTruthy();
        expect(getByTestId('note-backdrop').findAllByType(LinearGradient)).toHaveLength(1);

        const style = Object.assign({}, ...[banner.props.style].flat(Infinity));
        const width = Dimensions.get('window').width;
        // Nearly the display's width, solid white, and set a little off level.
        expect(style.width).toBe(width - 8);
        expect(style.backgroundColor).toBe('hsl(0, 0%, 100%)');
        expect(style.transform).toEqual([{ rotate: '-3deg' }]);
    });

    it('keeps the list for the goals that are about the notes adding up', () => {
        for (const goal of ['practise', 'habit']) {
            mockGoal = goal;
            const { getByLabelText, queryByLabelText, unmount } = render(<NotePreviewScreen />);

            expect(getByLabelText('A list of past therapy notes, each with the date of its session')).toBeTruthy();
            expect(queryByLabelText(/notification from Plastic Brains/)).toBeNull();
            unmount();
        }
    });

    it('drops the card when no goal was chosen', () => {
        mockGoal = null;

        const { queryByText } = render(<NotePreviewScreen />);

        const goal = GOAL_OPTIONS.find((option) => option.id === 'prepare')!;
        expect(queryByText(goal.restated)).toBeNull();
    });

    it('fades the list out into its own pale ground, never into the navy page', () => {
        mockGoal = 'practise';
        const { getByTestId } = render(<NotePreviewScreen />);
        const { LinearGradient } = require('expo-linear-gradient');
        const { SURFACE_BLUE, SURFACE_BLUE_FADE } = require('designs/designs-colors');

        const [fade] = getByTestId('note-backdrop').findAllByType(LinearGradient);

        // The bottom of the screen belongs to the phone in the picture. Fading
        // to the page's navy put a dark band over the last of the list.
        expect(fade.props.colors).toEqual([SURFACE_BLUE_FADE, SURFACE_BLUE, SURFACE_BLUE]);
    });
});
