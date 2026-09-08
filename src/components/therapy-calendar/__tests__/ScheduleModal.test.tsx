import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import ScheduleModal from '../ScheduleModal';

const props = {
    defaultTime: new Date(2026, 0, 1, 9, 0, 0),
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    onDelete: jest.fn(),
    selectedDate: '2026-09-15',
    visible: true,
};

describe('ScheduleModal actions', () => {
    beforeEach(() => { jest.clearAllMocks(); });
    it('offers Add Session on a free day', () => {
        render(<ScheduleModal { ...props } existingSession={ null } />);

        expect(screen.getByText('Add Session')).toBeTruthy();
    });

    it('offers Delete and Update on a day that already has one', () => {
        render(
            <ScheduleModal
                { ...props }
                existingSession={ {
                    date: '2026-09-15',
                    id: '2026-09-15',
                    time: new Date(2026, 8, 15, 9, 0, 0),
                } }
            />,
        );

        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Update')).toBeTruthy();
    });

    it('keeps the edited time when a parent refresh supplies equivalent session objects', () => {
        const session = {
            id: 'session-1',
            date: '2026-09-15',
            time: new Date(2026, 8, 15, 9),
        };
        const view = render(<ScheduleModal { ...props } existingSession={ session } />);
        const selected = new Date(2026, 8, 15, 19, 45);
        act(() => {
            view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, selected);
        });
        view.rerender(
            <ScheduleModal
                { ...props }
                defaultTime={ new Date(props.defaultTime) }
                existingSession={ { ...session, time: new Date(session.time) } }
            />,
        );
        fireEvent.press(view.getByText('Update'));
        expect(props.onConfirm).toHaveBeenCalledWith('single', selected);
    });

    it('reloads the saved time when switching to another session', () => {
        const session = { id: 'session-1', date: '2026-09-15', time: new Date(2026, 8, 15, 9) };
        const view = render(<ScheduleModal { ...props } existingSession={ session } />);
        act(() => {
            view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, new Date(2026, 8, 15, 19));
        });
        view.rerender(<ScheduleModal { ...props } existingSession={ { ...session, id: 'session-2' } } />);
        expect(view.UNSAFE_getByType(DateTimePicker).props.value).toEqual(session.time);
    });

    it('ignores iOS dismiss events that echo the time before the edit', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ null } />);
        const selected = new Date(2026, 8, 15, 19, 45);
        act(() => {
            view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, selected);
        });
        act(() => {
            view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'dismissed' }, props.defaultTime);
        });
        fireEvent.press(view.getByText('Add Session'));
        expect(props.onConfirm).toHaveBeenCalledWith('weekly_pattern', selected);
    });
});
