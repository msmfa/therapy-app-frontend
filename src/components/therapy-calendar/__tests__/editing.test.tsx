import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScheduleModal from '../ScheduleModal';

it('updates only the selected existing appointment when no repeat choice is offered', async () => {
  const onConfirm = jest.fn();
  const { UNSAFE_getByType, getByText, queryByText } = render(<ScheduleModal
    visible selectedDate="2026-09-15"
    defaultTime={new Date(2026, 8, 15, 9)}
    existingSession={{ id: 's1', date: '2026-09-15', time: new Date(2026, 8, 15, 9) }}
    onCancel={jest.fn()} onDelete={jest.fn()} onConfirm={onConfirm}
  />);
  expect(queryByText('EVERY WEEK')).toBeNull();
  const newTime = new Date(2026, 8, 15, 11);
  await act(async () => {
    UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, newTime);
  });
  fireEvent.press(getByText('Update'));
  expect(onConfirm).toHaveBeenCalledWith('single', newTime);
});
