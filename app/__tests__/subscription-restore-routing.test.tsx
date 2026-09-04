import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { OnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import type { EntitlementState } from '../../src/features/subscription/types';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSetAnswer = jest.fn();
const mockShowAlert = jest.fn();
const mockRestore = jest.fn();
const mockPurchase = jest.fn();
const mockRefreshEntitlement = jest.fn();
const mockConsumePending = jest.fn<string | null, [string?]>(() => null);
const mockSetPending = jest.fn();

let mockIsAuthenticated = false;
let mockHasOnboarded = false;
let mockEntitlementState: EntitlementState = { status: 'inactive' };
let mockAnswers: OnboardingAnswers = {
    goal: null,
    sessionAt: null,
    sessionDateSkipped: false,
    cadence: null,
    morningMinutes: 450,
    eveningMinutes: 1200,
    plan: 'annual' as const,
    entitlementConfirmedThisSession: false,
    reminderScheduled: false,
    resumeRoute: '/(onboarding)/subscription-preview',
};

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: mockReplace, push: mockPush }),
    Redirect: ({ href }: { href: string }) => {
        const ReactForMock = require('react');
        const { Text: MockText } = require('react-native');
        return ReactForMock.createElement(MockText, null, `redirect:${href}`);
    },
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

jest.mock('../../src/context/onboarding/OnboardingContext', () => ({
    useOnboarding: () => ({ hasOnboarded: mockHasOnboarded, hydrated: true }),
}));

jest.mock('../../src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: mockAnswers,
        setAnswer: mockSetAnswer,
    }),
}));

jest.mock('../../src/features/subscription/useSubscriptionOffer', () => ({
    useSubscriptionOffer: () => ({
        state: {
            status: 'ready',
            offer: {
                annual: {
                    id: 'annual',
                    productId: 'com.plasticbrains.app.subscription.annual',
                    price: '£39.99',
                    monthlyEquivalent: '£3.33',
                    trial: { periods: 1, period: 'month' },
                },
                monthly: {
                    id: 'monthly',
                    productId: 'com.plasticbrains.app.subscription.monthly',
                    price: '£4.99',
                    monthlyEquivalent: null,
                    trial: { periods: 1, period: 'week' },
                },
                trialEligible: true,
            },
        },
        reload: jest.fn(),
    }),
}));

jest.mock('../../src/features/subscription/storeKit', () => ({
    restore: (...args: unknown[]) => mockRestore(...args),
    purchase: (...args: unknown[]) => mockPurchase(...args),
}));

jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => ({
        state: mockEntitlementState,
        refresh: mockRefreshEntitlement,
    }),
}));

jest.mock('../../src/features/onboarding/authReturn', () => ({
    ACCOUNT_STEP_RETURN: 'account-preview',
    SUBSCRIPTION_STEP_RETURN: 'subscription-preview',
    consumePendingOnboardingStep: (expected?: string) => mockConsumePending(expected),
    setPendingOnboardingStep: (...args: unknown[]) => mockSetPending(...args),
}));

jest.mock('../../src/auth/useOAuthLogin', () => ({
    useOAuthLogin: () => ({
        appleAvailable: false,
        loadingProvider: null,
        signInWithApple: jest.fn(),
    }),
}));

jest.mock('../../src/components/onboarding/OnboardingScreen', () => ({
    ...(() => {
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
                ReactForMock.createElement(MockText, null, supporting),
                children,
                footer,
            ),
        };
    })(),
}));

jest.mock('../../src/components/onboarding/SubscriptionPlanCard', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return {
        SubscriptionPlanCard: ({ title }: { title: string }) =>
            ReactForMock.createElement(MockText, null, title),
    };
});

jest.mock('../../src/components/ui/Loading', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return () => ReactForMock.createElement(MockText, null, 'loading');
});

jest.mock('../../src/components/onboarding/AppleSignInButton', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return {
        AppleSignInButton: () => ReactForMock.createElement(MockText, null, 'Apple sign in'),
    };
});

jest.mock('@expo/vector-icons', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return { Feather: () => ReactForMock.createElement(MockView) };
});

import AccountPreviewScreen from '../(onboarding)/account-preview';
import SubscriptionPreviewScreen from '../(onboarding)/subscription-preview';

describe('restored-subscription onboarding routing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConsumePending.mockReturnValue(null);
        mockIsAuthenticated = false;
        mockHasOnboarded = false;
        mockEntitlementState = { status: 'inactive' };
        mockAnswers = {
            goal: 'remember',
            sessionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            sessionDateSkipped: false,
            cadence: 'weekly',
            morningMinutes: 450,
            eveningMinutes: 1200,
            plan: 'annual',
            entitlementConfirmedThisSession: false,
            reminderScheduled: false,
            resumeRoute: '/(onboarding)/subscription-preview',
        };
        mockRestore.mockResolvedValue({ status: 'restored' });
    });

    it('requires app authentication before asking Apple to restore', async () => {
        const { getByText } = render(<SubscriptionPreviewScreen />);

        expect(getByText('Annual plan: 1 month free. Then £39.99 per year')).toBeTruthy();
        expect(getByText('Renews annually until cancelled.')).toBeTruthy();

        fireEvent.press(getByText('Restore purchases'));

        await waitFor(() => {
            expect(mockSetPending).toHaveBeenCalledWith('subscription-preview');
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/(auth)/login',
                params: { returnTo: 'subscription-preview' },
            });
        });
        expect(mockRestore).not.toHaveBeenCalled();
        expect(mockSetAnswer).not.toHaveBeenCalled();
    });

    it('keeps the selected monthly trial and full price beside the purchase action', () => {
        mockAnswers = { ...mockAnswers, plan: 'monthly' };

        const { getByText } = render(<SubscriptionPreviewScreen />);

        expect(getByText('Monthly plan: 1 week free. Then £4.99 per month')).toBeTruthy();
        expect(getByText('Renews monthly until cancelled.')).toBeTruthy();
    });

    it('verifies a restore against the signed-in app account before continuing', async () => {
        mockIsAuthenticated = true;
        const { getByText } = render(<SubscriptionPreviewScreen />);

        fireEvent.press(getByText('Restore purchases'));

        await waitFor(() => {
            expect(mockRestore).toHaveBeenCalledWith({ syncWithServer: true });
            expect(mockSetAnswer).toHaveBeenCalledWith(
                'entitlementConfirmedThisSession',
                true,
            );
            expect(mockRefreshEntitlement).toHaveBeenCalledTimes(1);
            expect(mockShowAlert).toHaveBeenCalled();
        });

        const options = mockShowAlert.mock.calls[0][2] as {
            primaryAction: { onPress: () => void };
        };
        act(() => options.primaryAction.onPress());

        expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/notifications-preview');
    });

    it('automatically resumes restore after the requested sign-in completes', async () => {
        mockIsAuthenticated = true;
        mockConsumePending.mockReturnValue('/(onboarding)/subscription-preview');

        render(<SubscriptionPreviewScreen />);

        await waitFor(() => {
            expect(mockConsumePending).toHaveBeenCalledWith('subscription-preview');
            expect(mockRestore).toHaveBeenCalledWith({ syncWithServer: true });
            expect(mockSetAnswer).toHaveBeenCalledWith(
                'entitlementConfirmedThisSession',
                true,
            );
        });
    });

    it('resumes onboarding from a durable entitlement after an app relaunch', async () => {
        mockIsAuthenticated = true;
        mockEntitlementState = {
            status: 'active',
            plan: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            expiresAt: null,
        };

        render(<SubscriptionPreviewScreen />);

        await waitFor(() => {
            expect(mockSetAnswer).toHaveBeenCalledWith(
                'entitlementConfirmedThisSession',
                true,
            );
            expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/notifications-preview');
        });
        expect(mockRestore).not.toHaveBeenCalled();
        expect(mockPurchase).not.toHaveBeenCalled();
    });

    it('ignores repeated restore taps while Apple restore is in progress', async () => {
        mockIsAuthenticated = true;
        let finishRestore: ((value: { status: 'no_entitlement' }) => void) | undefined;
        mockRestore.mockImplementation(() => new Promise((resolve) => {
            finishRestore = resolve;
        }));

        const { getByText } = render(<SubscriptionPreviewScreen />);
        const restoreButton = getByText('Restore purchases');
        fireEvent.press(restoreButton);
        fireEvent.press(restoreButton);

        expect(mockRestore).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishRestore?.({ status: 'no_entitlement' });
        });
    });

    it('does not purchase again after the restored user signs in', async () => {
        mockIsAuthenticated = true;
        mockAnswers = {
            ...mockAnswers,
            entitlementConfirmedThisSession: true,
        };

        const { getByText, queryByText } = render(<AccountPreviewScreen />);
        expect(getByText('Continue with your account')).toBeTruthy();
        expect(queryByText('Create an account to connect your schedule, reminder times and subscription. Your note contents still stay only on this iPhone.')).toBeNull();
        fireEvent.press(getByText('Continue'));

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/notifications-preview');
        });
        expect(mockPurchase).not.toHaveBeenCalled();
    });

    it('does not purchase again when StoreKit already reports an active plan', async () => {
        mockIsAuthenticated = true;
        mockEntitlementState = {
            status: 'active',
            plan: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            expiresAt: null,
        };

        const { getByText } = render(<AccountPreviewScreen />);
        fireEvent.press(getByText('Continue'));

        await waitFor(() => {
            expect(mockSetAnswer).toHaveBeenCalledWith(
                'entitlementConfirmedThisSession',
                true,
            );
            expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/notifications-preview');
        });
        expect(mockPurchase).not.toHaveBeenCalled();
    });

    it('waits for the entitlement check before resuming an automatic purchase', async () => {
        mockIsAuthenticated = true;
        mockEntitlementState = { status: 'loading' };
        mockPurchase.mockReturnValue(new Promise(() => {}));
        mockConsumePending.mockImplementation((expected) =>
            expected === 'account-preview' ? '/(onboarding)/account-preview' : null,
        );

        const screen = render(<AccountPreviewScreen />);
        expect(mockConsumePending).not.toHaveBeenCalled();
        expect(mockPurchase).not.toHaveBeenCalled();

        mockEntitlementState = { status: 'inactive' };
        screen.rerender(<AccountPreviewScreen />);

        await waitFor(() => {
            expect(mockConsumePending).toHaveBeenCalledWith('account-preview');
            expect(mockPurchase).toHaveBeenCalledWith('annual');
        });
    });

    it('refreshes the shared entitlement immediately after a purchase', async () => {
        mockIsAuthenticated = true;
        mockPurchase.mockResolvedValue({ status: 'purchased' });

        const { getByText } = render(<AccountPreviewScreen />);
        fireEvent.press(getByText('Continue'));

        await waitFor(() => {
            expect(mockPurchase).toHaveBeenCalledWith('annual');
            expect(mockRefreshEntitlement).toHaveBeenCalledTimes(1);
            expect(mockSetAnswer).toHaveBeenCalledWith(
                'entitlementConfirmedThisSession',
                true,
            );
            expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/notifications-preview');
        });
    });

    it('returns an existing user to the app without overwriting onboarding settings', async () => {
        mockIsAuthenticated = true;
        mockHasOnboarded = true;
        mockAnswers = {
            ...mockAnswers,
            entitlementConfirmedThisSession: true,
        };

        const { getByText } = render(<AccountPreviewScreen />);
        fireEvent.press(getByText('Continue'));

        await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
        expect(mockPurchase).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalledWith('/(onboarding)/notifications-preview');
    });

    it('returns an existing user to the app after renewing their subscription', async () => {
        mockIsAuthenticated = true;
        mockHasOnboarded = true;
        mockPurchase.mockResolvedValue({ status: 'purchased' });

        const { getByText } = render(<AccountPreviewScreen />);
        fireEvent.press(getByText('Continue'));

        await waitFor(() => {
            expect(mockPurchase).toHaveBeenCalledWith('annual');
            expect(mockRefreshEntitlement).toHaveBeenCalledTimes(1);
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
        });
        expect(mockReplace).not.toHaveBeenCalledWith('/(onboarding)/notifications-preview');
    });

    it('does not open the app when Apple receipt linking is rejected', async () => {
        mockIsAuthenticated = true;
        mockPurchase.mockResolvedValue({ status: 'unlinked' });

        const { getByText } = render(<AccountPreviewScreen />);
        fireEvent.press(getByText('Continue'));

        await waitFor(() => {
            expect(getByText("We couldn't connect this subscription")).toBeTruthy();
        });
        expect(mockRefreshEntitlement).not.toHaveBeenCalled();
        expect(mockSetAnswer).not.toHaveBeenCalledWith(
            'entitlementConfirmedThisSession',
            true,
        );
        expect(mockReplace).not.toHaveBeenCalledWith('/(onboarding)/notifications-preview');
        expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
    });
});
