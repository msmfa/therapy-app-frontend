import React from 'react';
import { jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';

import ForgotPasswordScreen from '../forgot-password';
import { requestPasswordReset } from '../../src/api/auth';
import { i18next } from '../../src/i18n';
import fr from '../../src/i18n/locales/fr.json';
import de from '../../src/i18n/locales/de.json';

const mockShowAlert = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/api/auth', () => ({
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
}));

jest.mock('src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: View,
        SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{ children }</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

jest.mock('src/components/ui/GlassMorphismWithCircle', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        GlassMorphismWithCircle: ({ children }: { children?: React.ReactNode }) => (
            <View testID="glass-mock">{ children }</View>
        ),
    };
});

jest.mock('src/components/ui/LinearGradientCircle', () => ({
    __esModule: true,
    default: () => null,
    CirclePosition: {
        BOTTOM_LEFT: 'BOTTOM_LEFT',
    },
}));

const mockedRequestPasswordReset = jest.mocked(requestPasswordReset);

describe('ForgotPasswordScreen request step', () => {
    beforeEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
        mockShowAlert.mockClear();
    });

    afterEach(async () => {
        await act(async () => { await i18next.changeLanguage('en'); });
    });

    it('submits trimmed email, shows success alert, and advances to reset step', async () => {
        mockedRequestPasswordReset.mockResolvedValueOnce({ message: 'Reset email sent' });

        const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByPlaceholderText('you@example.com'), '  user@example.com  ');
        const submitButton = getByText('Send reset code');
        await act(async () => {
            fireEvent.press(submitButton);
            await Promise.resolve();
        });

        expect(mockedRequestPasswordReset).toHaveBeenCalledWith('user@example.com');
        expect(mockShowAlert).toHaveBeenCalledWith('Check your email', 'Reset email sent');
        expect(getByText('Reset code')).toBeTruthy();
    });

    it.each([['fr', fr], ['de', de]] as const)(
        'translates the server confirmation in %s', async (language, copy) => {
            await i18next.changeLanguage(language);
            mockedRequestPasswordReset.mockResolvedValueOnce({
                message: 'If an account exists, a password reset code has been sent.',
                code: 'password_reset_requested',
            });
            const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

            fireEvent.changeText(getByPlaceholderText(copy.auth.field.emailPlaceholder), 'person@example.com');
            await act(async () => { fireEvent.press(getByText(copy.auth.forgot.sendCode)); });

            expect(mockShowAlert).toHaveBeenCalledWith(
                copy.auth.forgot.checkEmailTitle, copy.serverError.password_reset_requested,
            );
            expect(getByText(copy.auth.field.resetCode)).toBeTruthy();
        },
    );

    it('shows an error alert when the request fails', async () => {
        mockedRequestPasswordReset.mockRejectedValueOnce(new Error('offline'));

        const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByPlaceholderText('you@example.com'), 'person@example.com');
        const submitButton = getByText('Send reset code');
        await act(async () => {
            fireEvent.press(submitButton);
            await Promise.resolve();
        });

        expect(mockedRequestPasswordReset).toHaveBeenCalledWith('person@example.com');
        expect(mockShowAlert).toHaveBeenCalledWith('Request failed', 'offline');
    });
});
