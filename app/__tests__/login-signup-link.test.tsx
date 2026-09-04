import React from 'react';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react-native';

let mockParams: { returnTo?: string } = {};

jest.mock('expo-router', () => {
	const React = require('react');
	const { Text } = require('react-native');
	return {
		useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
		useLocalSearchParams: () => mockParams,
		Link: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
	};
});

jest.mock('../../src/context/auth/AuthContext', () => ({
	useAuth: () => ({ setAuth: jest.fn() }),
}));

jest.mock('../../src/api/auth', () => ({ loginWithPassword: jest.fn() }));

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

jest.mock('../../src/components/auth/SocialAuthButtons', () => {
	const { View } = require('react-native');
	return { __esModule: true, default: View };
});

jest.mock('src/components/ui/BackButton', () => {
	const { View } = require('react-native');
	return { BackButton: View };
});

import LoginScreen from '../(auth)/login';

describe('the signup link on Sign in', () => {
	afterEach(() => {
		mockParams = {};
	});

	it("is offered when sign-in was opened from onboarding's account step", () => {
		mockParams = { returnTo: 'account-preview' };

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
});
