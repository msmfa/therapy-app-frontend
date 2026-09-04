import React from 'react';
import { render } from '@testing-library/react-native';

let mockIsAuthenticated = false;
let mockParams: { returnTo?: string; source?: string } = {};

jest.mock('expo-router', () => {
    const ReactForMock = require('react');
    const { Text: MockText, View: MockView } = require('react-native');
    const MockStack = ({ children }: { children?: React.ReactNode }) =>
        ReactForMock.createElement(MockView, { testID: 'auth-stack' }, children);
    MockStack.Screen = () => null;

    return {
        Stack: MockStack,
        Redirect: ({ href }: { href: string }) =>
            ReactForMock.createElement(MockText, null, `redirect:${href}`),
        useGlobalSearchParams: () => mockParams,
    };
});

jest.mock('@react-navigation/native', () => ({
    useTheme: () => ({ colors: { background: '#fff' } }),
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

import AuthLayout from '../(auth)/_layout';

describe('authentication entry routing', () => {
    beforeEach(() => {
        mockIsAuthenticated = false;
        mockParams = {};
    });

    it('sends a restored bare login route back to onboarding', () => {
        const { getByText, queryByTestId } = render(<AuthLayout />);

        expect(getByText('redirect:/(onboarding)')).toBeTruthy();
        expect(queryByTestId('auth-stack')).toBeNull();
    });

    it('keeps sign-in open when the user chose it from Welcome', () => {
        mockParams = { source: 'welcome' };

        const { getByTestId, queryByText } = render(<AuthLayout />);

        expect(getByTestId('auth-stack')).toBeTruthy();
        expect(queryByText('redirect:/(onboarding)')).toBeNull();
    });

    it('keeps authentication open for account and restore handoffs', () => {
        mockParams = { returnTo: 'account-preview' };
        const account = render(<AuthLayout />);
        expect(account.getByTestId('auth-stack')).toBeTruthy();
        account.unmount();

        mockParams = { returnTo: 'subscription-preview' };
        const restore = render(<AuthLayout />);
        expect(restore.getByTestId('auth-stack')).toBeTruthy();
    });

    it('does not accept an arbitrary source as deliberate sign-in intent', () => {
        mockParams = { source: 'https://example.com' };

        const { getByText } = render(<AuthLayout />);

        expect(getByText('redirect:/(onboarding)')).toBeTruthy();
    });

    it('returns an authenticated account to its allow-listed onboarding step', () => {
        mockIsAuthenticated = true;
        mockParams = { returnTo: 'account-preview' };

        const { getByText } = render(<AuthLayout />);

        expect(getByText('redirect:/(onboarding)/account-preview')).toBeTruthy();
    });
});
