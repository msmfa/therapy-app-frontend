import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockSetAnswer = jest.fn();
let mockSessionAt: Date | null = null;
type PickerProps = {
    minimumDate?: Date;
    maximumDate?: Date;
    value: Date;
    onChange: (event: { type: string }, selected: Date) => void;
};
let mockPicker: PickerProps;
let mockNativeMinimum: number | undefined;
let mockNativeMaximum: number | undefined;
let mockPreviousMinimum = 0;
let mockPreviousMaximum = 0;

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({
        answers: { sessionAt: mockSessionAt },
        setAnswer: mockSetAnswer,
    }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return function MockDateTimePicker(props: PickerProps) {
        mockPicker = props;
        // Match 8.4.4's Fabric updatePropsForPicker: a changed optional bound
        // is converted to NSDate even when its new codegen value is zero.
        // These values survive unmount to model a recycled native picker.
        const minimum = props.minimumDate?.getTime() ?? 0;
        const maximum = props.maximumDate?.getTime() ?? 0;
        if (minimum !== mockPreviousMinimum) mockNativeMinimum = minimum;
        if (maximum !== mockPreviousMaximum) mockNativeMaximum = maximum;
        mockPreviousMinimum = minimum;
        mockPreviousMaximum = maximum;
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
import { SESSION_DATE_COPY } from '../../src/features/onboarding/onboardingCopy';

describe('onboarding session date', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSessionAt = null;
        mockNativeMinimum = undefined;
        mockNativeMaximum = undefined;
        mockPreviousMinimum = 0;
        mockPreviousMaximum = 0;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('lets a rejected invalid draft recover through valid picker defaults', () => {
        mockSessionAt = new Date(NaN);
        const { getByLabelText } = render(<SessionDateScreen />);
        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);

        fireEvent.press(getByLabelText('Date. Not chosen'));
        fireEvent.press(getByLabelText('Time. Not chosen'));
        fireEvent.press(getByLabelText('Continue'));

        const selected = mockSetAnswer.mock.calls[0][1] as Date;
        expect(Number.isFinite(selected.getTime())).toBe(true);
        expect(selected.getTime()).toBeGreaterThan(Date.now());
        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/session-cadence');
    });

    it('rechecks the clock at Continue and explains a date that expired while the screen stayed open', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-09-04T12:00:00'));
        const { getByLabelText, getByText } = render(<SessionDateScreen />);
        fireEvent.press(getByLabelText('Date. Not chosen'));
        fireEvent.press(getByLabelText('Time. Not chosen'));
        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);

        // The picker starts tomorrow at 17:00. Advancing the clock alone does
        // not rerender the screen or recalculate its displayed validation.
        jest.setSystemTime(new Date('2026-09-05T17:00:00'));
        fireEvent.press(getByLabelText('Continue'));

        expect(mockSetAnswer).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);
        expect(getByText(SESSION_DATE_COPY.validation)).toBeTruthy();
    });

    it('accepts the visible defaults when each iOS spinner is opened', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(true);

        fireEvent.press(getByLabelText('Date. Not chosen'));
        fireEvent.press(getByLabelText('Time. Not chosen'));

        expect(getByLabelText('Continue').props.accessibilityState.disabled).toBe(false);
        fireEvent.press(getByLabelText('Continue'));

        const selected = mockSetAnswer.mock.calls[0][1] as Date;
        expect(mockSetAnswer).toHaveBeenCalledWith('sessionAt', expect.any(Date));
        expect(mockSetAnswer).toHaveBeenCalledWith('sessionDateSkipped', false);
        expect(selected.getTime()).toBeGreaterThan(Date.now());
        expect(selected.getHours()).toBe(17);
        expect(selected.getMinutes()).toBe(0);
        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/session-cadence');
    });

    it('keeps wheel choices after recycling the bounded date picker as a time picker', () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 8, 8, 12));
        const view = render(<SessionDateScreen />);
        fireEvent.press(view.getByLabelText('Date. Not chosen'));
        act(() => {
            mockPicker.onChange({ type: 'set' }, new Date(2026, 8, 10, 17));
        });
        fireEvent.press(view.getByLabelText('Time. Not chosen'));

        for (const [hour, minute] of [[8, 15], [19, 45], [23, 59], [6, 30]]) {
            const requested = new Date(2026, 8, 10, hour, minute).getTime();
            // A native UIDatePicker constrains the wheel to its active range.
            // Clearing both date bounds used to pin this value to epoch zero.
            const selected = new Date(Math.max(
                mockNativeMinimum ?? -Infinity,
                Math.min(mockNativeMaximum ?? Infinity, requested),
            ));
            act(() => { mockPicker.onChange({ type: 'set' }, selected); });
            expect(mockPicker.value.getHours()).toBe(hour);
            expect(mockPicker.value.getMinutes()).toBe(minute);
        }

        // A stale dismiss callback must not undo the last wheel selection.
        act(() => {
            mockPicker.onChange({ type: 'dismissed' }, new Date(2026, 8, 10, 1));
        });
        fireEvent.press(view.getByLabelText(/^Date\./));
        fireEvent.press(view.getByLabelText(/^Time\./));
        fireEvent.press(view.getByLabelText('Continue'));

        expect(mockSetAnswer).toHaveBeenCalledWith('sessionAt', new Date(2026, 8, 10, 6, 30));
    });

    it('continues with an explicit sample plan without saving a fake appointment', () => {
        const { getByLabelText } = render(<SessionDateScreen />);

        fireEvent.press(getByLabelText("I haven't booked it yet"));

        expect(mockSetAnswer).toHaveBeenCalledWith('sessionAt', null);
        expect(mockSetAnswer).toHaveBeenCalledWith('sessionDateSkipped', true);
        expect(mockSetAnswer).toHaveBeenCalledWith('reminderScheduled', false);
        expect(mockPush).toHaveBeenCalledWith('/(onboarding)/session-cadence');
    });
});
