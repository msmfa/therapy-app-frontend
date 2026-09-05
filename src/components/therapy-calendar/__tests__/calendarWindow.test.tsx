import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Calendar } from 'react-native-calendars';
import TherapyCalendar from '../TherapyCalendar';

jest.mock('react-native-calendars', () => ({
    Calendar: (props: object) => {
        const { View } = require('react-native');
        return <View {...props} />;
    },
}));

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 5, 12));
});
afterEach(() => { jest.useRealTimers(); });

it.each(['light', 'dark'] as const)('bounds the %s calendar and ignores presses outside its window', (variant) => {
    const view = render(<TherapyCalendar variant={variant} selectedSessions={{}} onSelectedSessionsChange={jest.fn()} />);
    const calendar = view.UNSAFE_getByType(Calendar);
    expect(calendar.props.minDate).toBe('2026-09-05');
    expect(calendar.props.maxDate).toBe('2027-09-05');
    expect(calendar.props.disableAllTouchEventsForDisabledDays).toBe(true);

    for (const dateString of ['2026-09-04', '2027-09-06']) {
        act(() => { calendar.props.onDayPress({ dateString }); });
        expect(view.queryByText('Add Session')).toBeNull();
    }
});

it('shows the shortened repeat count and only adds dates through the final allowed day', () => {
    const changed = jest.fn();
    const view = render(<TherapyCalendar selectedSessions={{}} onSelectedSessionsChange={changed} />);
    act(() => { view.UNSAFE_getByType(Calendar).props.onDayPress({ dateString: '2027-08-29' }); });

    expect(view.getByText('2 SESSIONS')).toBeTruthy();
    fireEvent.press(view.getByText('Add Session'));

    expect(changed).toHaveBeenCalledTimes(1);
    expect(Object.keys(changed.mock.calls[0][0])).toEqual(['2027-08-29', '2027-09-05']);
    expect(changed.mock.calls[0][0]['2027-09-05'].getHours()).toBe(9);
});

it('allows a single appointment on the final day', () => {
    const changed = jest.fn();
    const view = render(<TherapyCalendar selectedSessions={{}} onSelectedSessionsChange={changed} />);
    act(() => { view.UNSAFE_getByType(Calendar).props.onDayPress({ dateString: '2027-09-05' }); });
    expect(view.getByText('1 SESSION')).toBeTruthy();
    fireEvent.press(view.getByText('THIS DAY ONLY'));
    fireEvent.press(view.getByText('Add Session'));
    expect(Object.keys(changed.mock.calls[0][0])).toEqual(['2027-09-05']);
});
