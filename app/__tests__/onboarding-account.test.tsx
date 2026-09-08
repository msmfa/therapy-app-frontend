import React from 'react';
import { render } from '@testing-library/react-native';
import type { OnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import type { EntitlementState, SubscriptionOfferState } from '../../src/features/subscription/types';
import { minutesToDate, timeLabel } from '../../src/features/onboarding/formatting';

let mockIsAuthenticated = false;
let mockAppleAvailable = true;
let mockOffer: SubscriptionOfferState = { status: 'loading' };
let mockEntitlement: EntitlementState = { status: 'inactive' };
let mockAnswers: OnboardingAnswers;

const systemDateTimeFormat = Intl.DateTimeFormat;

const readyOffer = (trialEligible: boolean): SubscriptionOfferState => ({
    status: 'ready',
    offer: {
        annual: {
            id: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            price: '£39.99',
            monthlyEquivalent: '£3.33',
            trial: { periods: 2, period: 'week' },
        },
        monthly: {
            id: 'monthly',
            productId: 'com.plasticbrains.app.subscription.monthly',
            price: '£4.99',
            monthlyEquivalent: null,
            trial: { periods: 1, period: 'week' },
        },
        trialEligible,
    },
});

jest.mock('expo-router', () => ({
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
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
    useOnboarding: () => ({ hasOnboarded: false, hydrated: true }),
}));
jest.mock('../../src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: jest.fn() }),
}));
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ answers: mockAnswers, setAnswer: jest.fn() }),
}));
jest.mock('../../src/features/subscription/useSubscriptionOffer', () => ({
    useSubscriptionOffer: () => ({ state: mockOffer, reload: jest.fn() }),
}));
jest.mock('../../src/features/subscription/storeKit', () => ({ purchase: jest.fn() }));
jest.mock('../../src/features/subscription/EntitlementContext', () => ({
    useEntitlementState: () => ({ state: mockEntitlement, refresh: jest.fn() }),
}));
jest.mock('../../src/features/onboarding/authReturn', () => ({
    ACCOUNT_STEP_RETURN: 'account-preview',
    consumePendingOnboardingStep: () => null,
    setPendingOnboardingStep: jest.fn(),
}));
jest.mock('../../src/auth/useOAuthLogin', () => ({
    useOAuthLogin: () => ({
        appleAvailable: mockAppleAvailable,
        loadingProvider: null,
        signInWithApple: jest.fn(),
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
            ReactForMock.createElement(MockView, { testID: 'footer' }, footer),
        ),
    };
});
jest.mock('../../src/components/onboarding/AppleSignInButton', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return { AppleSignInButton: () => ReactForMock.createElement(MockText, null, 'Apple sign in') };
});
jest.mock('@expo/vector-icons', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return { Feather: () => ReactForMock.createElement(MockView) };
});

import AccountPreviewScreen from '../(onboarding)/account-preview';

describe('the account step', () => {
    beforeEach(() => {
        // This copy fixture uses UK date order; keep the test independent of the host locale.
        jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((locales, options) =>
            new systemDateTimeFormat(locales ?? 'en-GB', options));
        mockIsAuthenticated = false;
        mockAppleAvailable = true;
        mockOffer = readyOffer(true);
        mockEntitlement = { status: 'inactive' };
        mockAnswers = {
            goal: 'prepare',
            // A Monday.
            sessionAt: new Date(2026, 8, 14, 18, 0, 0, 0),
            sessionDateSkipped: false,
            cadence: 'weekly',
            morningMinutes: 450,
            eveningMinutes: 1200,
            plan: 'annual',
            entitlementConfirmedThisSession: false,
            reminderScheduled: false,
            resumeRoute: '/(onboarding)/account-preview',
        };
    });

    afterEach(() => { jest.restoreAllMocks(); });

    it('shows what the account will hold: the session, the times and the plan with its price', () => {
        const { getByText } = render(<AccountPreviewScreen />);

        expect(getByText(/^Every week, from Mon 14 Sep/)).toBeTruthy();
        const times = `${timeLabel(minutesToDate(450))} and ${timeLabel(minutesToDate(1200))}`;
        expect(getByText(times)).toBeTruthy();
        expect(getByText('Annual, 2 weeks free then £39.99/year')).toBeTruthy();
    });

    it('names the plan alone while the store has not answered, never an invented price', () => {
        mockOffer = { status: 'loading' };
        const { getByText, queryByText } = render(<AccountPreviewScreen />);

        expect(getByText('Annual')).toBeTruthy();
        expect(queryByText(/£/)).toBeNull();
    });

    it('says the session is still to be added when it was skipped', () => {
        mockAnswers = { ...mockAnswers, sessionAt: null, sessionDateSkipped: true, cadence: 'varies' };
        const { getByText } = render(<AccountPreviewScreen />);

        expect(getByText('Add your next session in Calendar')).toBeTruthy();
    });

    it("warns that Apple's sheet follows sign-in, and that a trial costs nothing today", () => {
        const { getByText } = render(<AccountPreviewScreen />);

        expect(getByText("After you sign in, Apple will ask you to confirm your free trial. You won't be charged today. You can cancel at any time through Apple subscriptions.")).toBeTruthy();
    });

    it('promises no trial to someone Apple says cannot have one', () => {
        mockOffer = readyOffer(false);
        mockIsAuthenticated = true;
        const { getByText } = render(<AccountPreviewScreen />);

        expect(getByText('Annual, £39.99/year')).toBeTruthy();
        expect(getByText('When you continue, Apple will ask you to confirm your subscription. You can cancel at any time through Apple subscriptions.')).toBeTruthy();
    });

    it('does not promise another checkout when a subscription was restored from a previous session', () => {
        mockIsAuthenticated = true;
        mockEntitlement = {
            status: 'active', plan: 'monthly', productId: 'monthly-product', expiresAt: null,
        };
        const { getByText, queryByText } = render(<AccountPreviewScreen />);

        expect(getByText('Already active')).toBeTruthy();
        expect(getByText(/^Your subscription is already active, so there is nothing to confirm\./)).toBeTruthy();
        expect(queryByText(/Apple will ask/)).toBeNull();
        expect(queryByText(/^Annual,/)).toBeNull();
    });

    it('does not infer the restored subscription plan from the last selected plan', () => {
        mockIsAuthenticated = true;
        mockAnswers.entitlementConfirmedThisSession = true;
        const { getByText, queryByText } = render(<AccountPreviewScreen />);

        expect(getByText('Already active')).toBeTruthy();
        expect(queryByText(/Apple will ask/)).toBeNull();
        expect(queryByText(/^Annual,/)).toBeNull();
    });

    it('introduces the two legal documents once, as links, in the action footer', () => {
        const { getByTestId, queryByText } = render(<AccountPreviewScreen />);
        const { within } = require('@testing-library/react-native');

        // Keep the notice and its document links together with the actions.
        const footer = within(getByTestId('footer'));
        expect(footer.getByText('By continuing, you agree to:')).toBeTruthy();
        expect(footer.getByText('Terms of Service')).toBeTruthy();
        expect(footer.getByText('Privacy Policy')).toBeTruthy();
        expect(queryByText(/agree to the Terms/)).toBeNull();
    });

    it('keeps the account step focused on creating or connecting an account', () => {
        const first = render(<AccountPreviewScreen />);
        expect(first.getByText('Continue with email')).toBeTruthy();
        expect(first.queryByText('Already have an account? Sign in')).toBeNull();
        first.unmount();

        mockIsAuthenticated = true;
        const { queryByText } = render(<AccountPreviewScreen />);
        expect(queryByText('Already have an account? Sign in')).toBeNull();
    });

    it('offers email as a button beside Apple, not a footnote', () => {
        const { getByTestId } = render(<AccountPreviewScreen />);
        const { TouchableOpacity } = require('react-native');

        const footer = getByTestId('footer');
        // Text links carry an arrow icon after their label; the glass pill does not.
        const [email] = footer.findAllByType(TouchableOpacity).filter(
            (button: { props: { accessibilityLabel?: string } }) => button.props.accessibilityLabel === 'Continue with email',
        );
        expect(email).toBeTruthy();
        expect(email.findAllByProps({ name: 'arrow-right' })).toHaveLength(0);
    });
});
