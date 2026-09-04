import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SESSION_DATE_COPY } from '../../src/features/onboarding/onboardingCopy';
import {
    isWithinFirstSessionWindow,
    latestFirstSessionAt,
} from '../../src/utils/sessionWindow';

const mockPush = jest.fn();
const mockSetAnswer = jest.fn();

/**
 * A draft restored from a previous run, saved before the limit existed or on a
 * build that did not enforce it. It is deliberately not rewritten: silently
 * moving someone's appointment is worse than telling them it will not work.
 */
const mockOutOfRange = (() => {
    const beyond = new Date(latestFirstSessionAt());
    beyond.setMonth(beyond.getMonth() + 2);
    return beyond;
})();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: { sessionAt: mockOutOfRange },
        setAnswer: mockSetAnswer,
    }),
}));

const pickerProps: Record<string, unknown>[] = [];

jest.mock('@react-native-community/datetimepicker', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return function MockDateTimePicker(props: Record<string, unknown>) {
        pickerProps.push(props);
        return ReactForMock.createElement(MockView, { testID: 'date-time-picker' });
    };
});

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
    const ReactForMock = require('react');
    const { Text: MockText, View: MockView } = require('react-native');
    return {
        OnboardingScreen: ({
            headline,
            children,
            footer,
        }: {
            headline: string;
            children?: React.ReactNode;
            footer: React.ReactNode;
        }) => ReactForMock.createElement(
            MockView,
            null,
            ReactForMock.createElement(MockText, null, headline),
            children,
            footer,
        ),
    };
});

import SessionDateScreen from '../(onboarding)/session-date';

describe('onboarding rejects a first session beyond the series horizon', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        pickerProps.length = 0;
    });

    it('is genuinely out of range to begin with', () => {
        expect(isWithinFirstSessionWindow(mockOutOfRange)).toBe(false);
    });

    it('cannot continue with a restored out-of-range draft', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);
    });

    it('explains why, in a live region', () => {
        const { getByText } = render(<SessionDateScreen />);

        const validation = getByText(SESSION_DATE_COPY.rangeValidation);
        expect(validation).toBeTruthy();
        expect(validation.props.accessibilityLiveRegion).toBe('polite');
    });

    it('does not save the out-of-range date if Continue is pressed anyway', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        fireEvent.press(getByLabelText('Continue'));

        expect(mockSetAnswer).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('leaves the restored draft exactly as the user saved it', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        fireEvent.press(getByLabelText('Continue'));

        // Nothing rewrote it to the limit or cleared it.
        expect(mockSetAnswer).not.toHaveBeenCalledWith('sessionAt', expect.anything());
    });

    it('bounds the date picker itself', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        // The row label carries the restored date, so match on its prefix.
        fireEvent.press(getByLabelText(/^Date\./));

        const datePicker = pickerProps.find((props) => props.mode === 'date');
        expect(datePicker).toBeDefined();

        const maximum = datePicker!.maximumDate as Date;
        const expected = latestFirstSessionAt();
        expect(maximum.toDateString()).toBe(expected.toDateString());
        expect(maximum.getHours()).toBe(23);
    });

    it('still offers the "not booked yet" path', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        fireEvent.press(getByLabelText(SESSION_DATE_COPY.sampleCta));

        expect(mockSetAnswer).toHaveBeenCalledWith('sessionAt', null);
        expect(mockSetAnswer).toHaveBeenCalledWith('sessionDateSkipped', true);
        expect(mockPush).toHaveBeenCalled();
    });
});
