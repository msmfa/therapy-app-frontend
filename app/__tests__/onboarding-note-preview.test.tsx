import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
}));

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
    const ReactForMock = require('react');
    const { Text: MockText, View: MockView } = require('react-native');
    return {
        OnboardingScreen: ({
            headline,
            children,
            footer,
        }: {
            headline: string;
            children?: React.ReactNode;
            footer?: React.ReactNode;
        }) => ReactForMock.createElement(
            MockView,
            null,
            ReactForMock.createElement(MockText, null, headline),
            children,
            footer,
        ),
    };
});

jest.mock('../../src/components/onboarding/NoteTemplateSheet', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return {
        NoteTemplateSheet: () => ReactForMock.createElement(MockText, null, 'Five-question preview'),
    };
});

import NotePreviewScreen from '../(onboarding)/note-preview';

describe('onboarding note preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('places the five-question research link beside the question preview', () => {
        const { getByText, getByRole } = render(<NotePreviewScreen />);

        expect(getByText('Five-question preview')).toBeTruthy();
        fireEvent.press(getByRole('link', { name: 'Why these five questions?' }));

        expect(mockPush).toHaveBeenCalledWith('/why-five-questions');
    });
});
