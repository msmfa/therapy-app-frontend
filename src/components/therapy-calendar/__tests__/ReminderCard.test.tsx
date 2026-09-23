import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarReminder } from '../../../api/therapy';
import { Reason } from '../../../features/reminders/types';
import { ReminderCard } from '../ReminderCard';

const reminder: CalendarReminder = {
    id: 'r1',
    kind: 'review_note',
    reason: Reason.PostSession,
    dueAtUtc: '2026-09-24T20:00:00.000Z',
    localDate: '2026-09-24',
    sessionId: 's1',
    status: 'pending',
};

const REASON = 'A same-day return gives you another chance to recall what stood out.';

// The reason is what a reader is looking at when they want to know more, so
// the whole band opens the write-up, not only the arrow at its end.
it('opens the write-up from anywhere on the reason band', () => {
    const onOpenScience = jest.fn();
    render(<ReminderCard reminder={ reminder } headline="Evening of your session" reason={ REASON } onOpenScience={ onOpenScience } />);

    fireEvent.press(screen.getByText(REASON));
    expect(onOpenScience).toHaveBeenCalledTimes(1);

    const band = screen.getByTestId('reminder-sheet.r1.why');
    expect(band.props.accessibilityRole).toBe('button');
    expect(band.props.accessibilityLabel).toBe(REASON);
});

it('leaves the band inert when there is no write-up to open', () => {
    render(<ReminderCard reminder={ { ...reminder, kind: 'log_note', reason: undefined } } headline="Take a post-session note" reason={ REASON } />);

    expect(screen.queryByTestId('reminder-sheet.r1.why')).toBeNull();
    expect(screen.queryByRole('button', { name: REASON })).toBeNull();
});
