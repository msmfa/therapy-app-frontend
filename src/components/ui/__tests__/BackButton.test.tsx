import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BackButton } from '../BackButton';

const mockBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: mockBack,
        canGoBack: mockCanGoBack,
        replace: mockReplace,
    }),
}));

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
}));

describe('BackButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses the logical previous route when the current screen has no history', () => {
        mockCanGoBack.mockReturnValue(false);
        const { getByRole } = render(
            <BackButton fallbackHref="/(onboarding)/goal" />,
        );

        fireEvent.press(getByRole('button', { name: 'Back' }));

        expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/goal');
        expect(mockBack).not.toHaveBeenCalled();
    });

    it('prefers normal navigation history when it is available', () => {
        mockCanGoBack.mockReturnValue(true);
        const { getByRole } = render(
            <BackButton fallbackHref="/(onboarding)/goal" />,
        );

        fireEvent.press(getByRole('button', { name: 'Back' }));

        expect(mockBack).toHaveBeenCalledTimes(1);
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not show a dead control without history or a fallback', () => {
        mockCanGoBack.mockReturnValue(false);
        const { queryByRole } = render(<BackButton />);

        expect(queryByRole('button', { name: 'Back' })).toBeNull();
    });
});
