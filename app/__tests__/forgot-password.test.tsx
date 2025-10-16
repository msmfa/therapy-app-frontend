import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '../forgot-password';
import { requestPasswordReset } from '../../src/api/auth';

const mockShowAlert = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: jest.fn() }),
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

    it('submits trimmed email, shows success alert, and advances to reset step', async () => {
        mockedRequestPasswordReset.mockResolvedValueOnce('Reset email sent');

        const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByPlaceholderText('you@example.com'), '  user@example.com  ');
        fireEvent.press(getByText('Send reset code'));

        await waitFor(() => {
            expect(mockedRequestPasswordReset).toHaveBeenCalledWith('user@example.com');
        });

        expect(mockShowAlert).toHaveBeenCalledWith('Check your email', 'Reset email sent');
        await waitFor(() => {
            expect(getByText('Reset code')).toBeTruthy();
        });
    });

    it('shows an error alert when the request fails', async () => {
        mockedRequestPasswordReset.mockRejectedValueOnce(new Error('offline'));

        const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByPlaceholderText('you@example.com'), 'person@example.com');
        fireEvent.press(getByText('Send reset code'));

        await waitFor(() => {
            expect(mockedRequestPasswordReset).toHaveBeenCalledWith('person@example.com');
        });

        expect(mockShowAlert).toHaveBeenCalledWith('Request failed', 'offline');
    });
});
