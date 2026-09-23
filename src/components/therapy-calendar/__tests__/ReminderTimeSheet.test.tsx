import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ReminderTimeSheet from '../ReminderTimeSheet';

it('closes unchanged, saves edited minutes, and returns to Close after refresh', () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const props = { visible: true, embedded: true, slot: 'evening' as const, minutes: 1260, onSave, onCancel };
    const view = render(<ReminderTimeSheet { ...props } />);
    fireEvent.press(screen.getByText('Close'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    act(() => view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, new Date(2026, 8, 23, 21, 15)));
    fireEvent.press(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(1275);
    view.rerender(<ReminderTimeSheet { ...props } minutes={ 1275 } />);
    expect(screen.getByText('Close')).toBeTruthy();
});
