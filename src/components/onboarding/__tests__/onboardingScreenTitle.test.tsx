import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
    useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

// Pin the layout to standard text sizes; the backdrop contract differs at
// accessibility sizes, where it joins the flow instead of being pinned.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
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

describe('the bottom backdrop', () => {
    const backdrop = <Text>notes artwork</Text>;

    it('is pinned, decorative, and behind everything else', () => {
        const { getByTestId } = renderScreen({ bottomBackdrop: backdrop });

        const region = getByTestId('onboarding-backdrop');
        // Fills everything between the content and the bottom edge, and is
        // untouchable so it can never swallow a tap meant for the footer.
        expect(region.props.pointerEvents).toBe('none');
        expect(region.props.style[0].flex).toBe(1);
        // The footer floats over the artwork rather than sitting below it, so
        // the artwork itself reaches the screen's bottom edge.
        const footer = getByTestId('onboarding-footer');
        expect(footer.props.style[1].position).toBe('absolute');
        expect(footer.props.style[1].bottom).toBe(0);
    });

    it('does not exist at all when a screen has no artwork', () => {
        const { queryByTestId } = renderScreen();

        expect(queryByTestId('onboarding-backdrop')).toBeNull();
    });
});

describe('the bottom backdrop at accessibility text sizes', () => {
    it('joins the combined scroll so it can never cover the actions', () => {
        const useWindowDimensions =
            require('react-native/Libraries/Utilities/useWindowDimensions').default;
        useWindowDimensions.mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 2 });

        const { getByTestId } = renderScreen({
            bottomBackdrop: <Text>notes artwork</Text>,
        });

        const inFlow = getByTestId('onboarding-backdrop');
        expect(inFlow.props.pointerEvents).toBeUndefined();
        expect(inFlow.props.style.position).toBeUndefined();

        useWindowDimensions.mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
    });
});
