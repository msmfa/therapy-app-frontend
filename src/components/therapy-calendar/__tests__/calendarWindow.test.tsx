import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Calendar } from 'react-native-calendars';
import TherapyCalendar from '../TherapyCalendar';
import ScheduleModal from '../ScheduleModal';

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

it('edits the session on an occupied day without offering another session', () => {
    const changed = jest.fn();
    const morning = new Date(2026, 8, 15, 9);
    const view = render(<TherapyCalendar selectedSessions={{ existing: morning }} onSelectedSessionsChange={changed} />);
    act(() => { view.UNSAFE_getByType(Calendar).props.onDayPress({ dateString: '2026-09-15' }); });
    expect(view.queryByText('Add another appointment')).toBeNull();
    expect(view.queryByText('Add Session')).toBeNull();
    expect(view.queryByText('Appointment at 9:00 AM')).toBeNull();
    expect(view.getByText('Update')).toBeTruthy();
    act(() => { view.UNSAFE_getByType(ScheduleModal).props.onConfirm('single', new Date(2026, 8, 15, 10)); });
    expect(changed).toHaveBeenCalledWith({ existing: new Date(2026, 8, 15, 10) });
});

it('preserves legacy same-day appointments and deletes only the chosen appointment', () => {
    const changed = jest.fn();
    const morning = new Date(2026, 8, 15, 9);
    const afternoon = new Date(2026, 8, 15, 16);
    const view = render(<TherapyCalendar selectedSessions={{ first: morning, second: afternoon }} onSelectedSessionsChange={changed} />);
    act(() => { view.UNSAFE_getByType(Calendar).props.onDayPress({ dateString: '2026-09-15' }); });
    expect(view.getByText('Appointment at 9:00 AM')).toBeTruthy();
    expect(view.getByText('Appointment at 4:00 PM')).toBeTruthy();
    expect(view.queryByText('Add another appointment')).toBeNull();
    fireEvent.press(view.getByText('Appointment at 4:00 PM'));
    fireEvent.press(view.getByText('Delete'));
    expect(changed).toHaveBeenCalledWith({ first: morning });
});
