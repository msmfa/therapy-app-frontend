import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import ScheduleModal from '../ScheduleModal';

const props = {
    defaultTime: new Date(2026, 0, 1, 9, 0, 0),
    onCancel: jest.fn(),
    onAdd: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    selectedDate: '2026-09-15',
    visible: true,
};

const single = { id: 'session-1', time: new Date(2026, 8, 15, 9), inSeries: false };
const inSeries = { ...single, inSeries: true };

const pickTime = (view: ReturnType<typeof render>, time: Date) => {
    act(() => {
        view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'set' }, time);
    });
};

describe('ScheduleModal actions', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('adds a weekly series by default on a free day', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ null } />);
        const selected = new Date(2026, 8, 15, 19, 45);
        pickTime(view, selected);

        fireEvent.press(screen.getByText('Add Session'));

        expect(props.onAdd).toHaveBeenCalledWith('weekly', selected);
    });

    it('adds a one-off when asked to', () => {
        render(<ScheduleModal { ...props } existingSession={ null } />);

        fireEvent.press(screen.getByText('THIS DAY ONLY'));
        fireEvent.press(screen.getByText('Add Session'));

        expect(props.onAdd).toHaveBeenCalledWith('single', props.defaultTime);
    });

    it('gives the dismiss backdrop a label, since it was previously an unlabelled tap target the size of the screen', () => {
        render(<ScheduleModal { ...props } existingSession={ null } />);

        expect(screen.getByRole('button', { name: 'Dismiss scheduling' })).toBeTruthy();
    });

    it('offers Delete and Update on a day that already has one, with no repeat choice', () => {
        render(<ScheduleModal { ...props } existingSession={ single } />);

        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Update')).toBeTruthy();
        expect(screen.queryByText('EVERY WEEK')).toBeNull();
        expect(screen.queryByText('THIS SESSION ONLY')).toBeNull();
    });

    it('updates only this appointment when it is not part of a series', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ single } />);
        const newTime = new Date(2026, 8, 15, 11);
        pickTime(view, newTime);

        fireEvent.press(screen.getByText('Update'));

        expect(props.onUpdate).toHaveBeenCalledWith(newTime, 'this');
    });

    it('lets an edit to a series appointment reach every later one', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ inSeries } />);
        // The badge is gone; the scope options are what say the session is in
        // a series, and they are the part you can act on.
        expect(screen.queryByText('PART OF A WEEKLY SERIES')).toBeNull();
        const newTime = new Date(2026, 8, 15, 11);
        pickTime(view, newTime);

        fireEvent.press(screen.getByText('ALL FUTURE SESSIONS'));
        fireEvent.press(screen.getByText('Update'));

        expect(props.onUpdate).toHaveBeenCalledWith(newTime, 'future');
    });

    it('names the scope on the delete button, and deletes one session without asking', () => {
        render(<ScheduleModal { ...props } existingSession={ inSeries } />);

        fireEvent.press(screen.getByText('Delete'));
        expect(props.onDelete).toHaveBeenCalledWith('this');

        fireEvent.press(screen.getByText('ALL FUTURE SESSIONS'));
        expect(screen.getByText('Delete all Tuesday sessions')).toBeTruthy();
        expect(screen.queryByText('Delete')).toBeNull();
    });

    // The question used to go through the app-wide alert, which is a modal of
    // its own: iOS refuses to present one modal over another and does it
    // silently, so the button did nothing at all. It is asked from inside
    // this sheet now, which is the one place it is certain to be seen.
    it('asks inside the sheet before ending a series, and ends it only on yes', () => {
        render(<ScheduleModal { ...props } existingSession={ inSeries } />);

        fireEvent.press(screen.getByText('ALL FUTURE SESSIONS'));
        fireEvent.press(screen.getByText('Delete all Tuesday sessions'));

        expect(screen.getByTestId('schedule-modal.end-series-confirm')).toBeTruthy();
        expect(props.onDelete).not.toHaveBeenCalled();

        fireEvent.press(screen.getByTestId('schedule-modal.end-series-confirm.confirm'));
        expect(props.onDelete).toHaveBeenCalledWith('future');
        expect(screen.queryByTestId('schedule-modal.end-series-confirm')).toBeNull();
    });

    it('leaves the series alone when the question is declined', () => {
        render(<ScheduleModal { ...props } existingSession={ inSeries } />);

        fireEvent.press(screen.getByText('ALL FUTURE SESSIONS'));
        fireEvent.press(screen.getByText('Delete all Tuesday sessions'));
        fireEvent.press(screen.getByTestId('schedule-modal.end-series-confirm.keep'));

        expect(props.onDelete).not.toHaveBeenCalled();
        expect(screen.queryByTestId('schedule-modal.end-series-confirm')).toBeNull();
    });

    it('keeps the edited time when a parent refresh supplies equivalent session objects', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ single } />);
        const selected = new Date(2026, 8, 15, 19, 45);
        pickTime(view, selected);
        view.rerender(
            <ScheduleModal
                { ...props }
                defaultTime={ new Date(props.defaultTime) }
                existingSession={ { ...single, time: new Date(single.time) } }
            />,
        );
        fireEvent.press(view.getByText('Update'));
        expect(props.onUpdate).toHaveBeenCalledWith(selected, 'this');
    });

    it('reloads the saved time when switching to another session', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ single } />);
        pickTime(view, new Date(2026, 8, 15, 19));
        view.rerender(<ScheduleModal { ...props } existingSession={ { ...single, id: 'session-2' } } />);
        expect(view.UNSAFE_getByType(DateTimePicker).props.value).toEqual(single.time);
    });

    it('ignores iOS dismiss events that echo the time before the edit', () => {
        const view = render(<ScheduleModal { ...props } existingSession={ null } />);
        const selected = new Date(2026, 8, 15, 19, 45);
        pickTime(view, selected);
        act(() => {
            view.UNSAFE_getByType(DateTimePicker).props.onChange({ type: 'dismissed' }, props.defaultTime);
        });
        fireEvent.press(view.getByText('Add Session'));
        expect(props.onAdd).toHaveBeenCalledWith('weekly', selected);
    });

    it('disables every commit while one is on its way to the server', () => {
        render(<ScheduleModal { ...props } existingSession={ inSeries } busy />);

        fireEvent.press(screen.getByText('Delete'));
        fireEvent.press(screen.getByText('Update'));

        expect(props.onDelete).not.toHaveBeenCalled();
        expect(props.onUpdate).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Saving')).toBeTruthy();
    });
});
