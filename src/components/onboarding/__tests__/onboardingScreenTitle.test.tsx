import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
    useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

import { OnboardingScreen } from '../OnboardingScreen';

const renderScreen = (props: Partial<React.ComponentProps<typeof OnboardingScreen>> = {}) =>
    render(
        <OnboardingScreen
            headline="Your plan is ready"
            backHref={ '/(onboarding)/goal' as never }
            footer={ <Text>Continue</Text> }
            { ...props }
        />,
    );

describe('where an onboarding screen puts its title', () => {
    it('keeps the large headline over the body while asking a question', () => {
        // The four personalisation steps are questions; they should read as one.
        const { queryByTestId, getByText } = renderScreen({ step: 2, headline: 'When is your next session?' });

        expect(queryByTestId('onboarding-header-title')).toBeNull();
        expect(getByText('When is your next session?')).toBeTruthy();
    });

    it('puts the title beside the back arrow on the screens after the steps', () => {
        const { getByTestId, getByLabelText } = renderScreen();

        expect(getByTestId('onboarding-header-title')).toBeTruthy();
        expect(getByTestId('onboarding-header-title').props.children).toBe('Your plan is ready');
        // Still reachable as a heading, and the arrow is still there to its left.
        expect(getByLabelText('Back')).toBeTruthy();
    });

    it('shows the title exactly once, wherever it sits', () => {
        const inline = renderScreen();
        expect(inline.getAllByText('Your plan is ready')).toHaveLength(1);
        inline.unmount();

        const stacked = renderScreen({ step: 1 });
        expect(stacked.getAllByText('Your plan is ready')).toHaveLength(1);
    });

    it('leaves a screen with no back arrow using the stacked headline', () => {
        // success and notifications-preview deliberately hide Back; a title
        // alone in an empty header row would read as a stray label.
        const { queryByTestId, getByText } = renderScreen({ showBack: false, backHref: undefined });

        expect(queryByTestId('onboarding-header-title')).toBeNull();
        expect(getByText('Your plan is ready')).toBeTruthy();
    });
});
