import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

let mockParams: { returnTo?: string | string[] } = {};
const mockReplace = jest.fn();
const mockAppleSignIn = jest.fn();
let mockAppleAvailable = true;
let mockAppleLoading = false;

jest.mock('expo-router', () => {
	const React = require('react');
	const { Text } = require('react-native');
	return {
		useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
		useLocalSearchParams: () => mockParams,
		Link: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
	};
});

jest.mock('../../src/context/auth/AuthContext', () => ({
	useAuth: () => ({ setAuth: jest.fn() }),
}));

jest.mock('../../src/api/auth', () => ({ loginWithPassword: jest.fn(), registerAccount: jest.fn() }));

jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: jest.fn() }) }));

jest.mock('@expo/vector-icons', () => ({
	Feather: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
	const { View } = require('react-native');
	return { SafeAreaView: View };
});

jest.mock('src/components/ui/GlassMorphismWithCircle', () => {
	const { View } = require('react-native');
	return { GlassMorphismWithCircle: View };
});

jest.mock('../../src/auth/useOAuthLogin', () => ({
	useOAuthLogin: (onSuccess?: () => void) => ({
		appleAvailable: mockAppleAvailable,
		loadingProvider: mockAppleLoading ? 'apple' : null,
		signInWithApple: () => {
			mockAppleSignIn();
			onSuccess?.();
		},
	}),
}));

jest.mock('src/components/ui/BackButton', () => {
	const { View } = require('react-native');
	return { BackButton: View };
});

import LoginScreen from '../(auth)/login';
import SignUpScreen from '../(auth)/signup';

describe('Sign in account links and Apple restore handoff', () => {
	afterEach(() => {
		mockParams = {};
		mockAppleAvailable = true;
		mockAppleLoading = false;
		jest.clearAllMocks();
	});

	it("is offered when sign-in was opened from onboarding's account step", () => {
		mockParams = { returnTo: 'account-preview' };

		const { queryByText } = render(<LoginScreen />);

		expect(queryByText("Don't have an account?")).not.toBeNull();
	});

	it('is withheld when sign-in was opened to restore a purchase, which needs an existing account', () => {
		mockParams = { returnTo: 'subscription-preview' };

		const { queryByText } = render(<LoginScreen />);

		expect(queryByText("Don't have an account?")).toBeNull();
	});

	it('uses the normalized account return route when query parameters are arrays', () => {
		mockParams = { returnTo: ['account-preview'] };

		const { queryByText } = render(<LoginScreen />);

		expect(queryByText("Don't have an account?")).not.toBeNull();
	});

	it('is withheld at the app entry point, so signup cannot bypass the plan', () => {
		mockParams = {};

		const { queryByText } = render(<LoginScreen />);

		expect(queryByText("Don't have an account?")).toBeNull();
	});

	it('is withheld when returnTo is not an allow-listed route', () => {
		mockParams = { returnTo: 'https://evil.example.com' };

		const { queryByText } = render(<LoginScreen />);

		expect(queryByText("Don't have an account?")).toBeNull();
	});

	it('returns Apple sign-in to the plan so its pending restore can continue', () => {
		mockParams = { returnTo: 'subscription-preview' };

		const { getByLabelText } = render(<LoginScreen />);
		fireEvent.press(getByLabelText('Continue with Apple'));

		expect(mockAppleSignIn).toHaveBeenCalledTimes(1);
		expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/subscription-preview');
	});

	it('keeps the Apple button visible but blocks repeat requests while sign-in is pending', () => {
		mockAppleLoading = true;

		const { getByLabelText } = render(<LoginScreen />);
		fireEvent.press(getByLabelText('Continue with Apple'));

		expect(getByLabelText('Signing in with Apple')).toBeTruthy();
		expect(mockAppleSignIn).not.toHaveBeenCalled();
	});

	it('does not leave an empty social sign-in heading when Apple authentication is unavailable', () => {
		mockAppleAvailable = false;

		const { queryByLabelText, queryByText } = render(<LoginScreen />);

		expect(queryByLabelText('Continue with Apple')).toBeNull();
		expect(queryByText('Or continue with')).toBeNull();
	});

	it('keeps Create account focused on email registration even when Apple is available', () => {
		mockParams = { returnTo: 'account-preview' };

		const { getByRole, queryByLabelText, queryByText } = render(<SignUpScreen />);

		expect(getByRole('button', { name: 'Create account' })).toBeTruthy();
		expect(queryByLabelText('Continue with Apple')).toBeNull();
		expect(queryByText('Or continue with')).toBeNull();
	});
});
