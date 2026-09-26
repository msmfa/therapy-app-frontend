import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { ProgressWidgetSync } from '../ProgressWidgetSync';
import { notifyProgressChanged } from '../progressEvents';
import { listReviewsForUser } from '../../reviews/reviewStore';
import { setProgressOwner, writeProgressWidget } from '../nativeProgress';
import { getCalendar } from '../../../api/therapy';

let mockOwner: string | null = 'a';
const mockCalendar = {
    scheduleSessions: [], reminders: [], revision: 1, hydrated: true,
    reminderScheduleSettings: { timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200 },
};
jest.mock('../../../context/auth/AuthContext', () => ({ useAuth: () => ({ user: mockOwner ? { id: mockOwner } : null, isAuthenticated: Boolean(mockOwner), hydrated: true }) }));
jest.mock('../../../context/therapy-sessions/TherapySessionsContext', () => ({ useTherapySessions: () => mockCalendar }));
jest.mock('../../reviews/reviewStore', () => ({ listReviewsForUser: jest.fn() }));
jest.mock('../../../api/therapy', () => ({ getCalendar: jest.fn() }));
jest.mock('../nativeProgress', () => ({ hasProgressWidget: () => true, setProgressOwner: jest.fn(), writeProgressWidget: jest.fn().mockResolvedValue(undefined) }));

beforeEach(() => {
    jest.clearAllMocks(); mockOwner = 'a';
    (listReviewsForUser as jest.Mock).mockResolvedValue([]);
});
it('writes a real empty state without sample progress and refreshes after mutations', async () => {
    const view = render(<ProgressWidgetSync />);
    await waitFor(() => expect(writeProgressWidget).toHaveBeenCalledTimes(1));
    expect(setProgressOwner).toHaveBeenCalledWith('a');
    expect((writeProgressWidget as jest.Mock).mock.calls[0][1].entries[0].progress).toMatchObject({ streak: 0, days: [], hasSchedule: false });
    act(() => notifyProgressChanged());
    await waitFor(() => expect(writeProgressWidget).toHaveBeenCalledTimes(2));
    expect(getCalendar).not.toHaveBeenCalled();
    view.unmount();
});
it('discards a late review read after logout and clears native ownership', async () => {
    let resolve!: (value: unknown[]) => void;
    (listReviewsForUser as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; }));
    const view = render(<ProgressWidgetSync />);
    mockOwner = null;
    view.rerender(<ProgressWidgetSync />);
    await act(async () => { resolve([]); });
    expect(setProgressOwner).toHaveBeenLastCalledWith(null);
    expect(writeProgressWidget).not.toHaveBeenCalled();
    view.unmount();
});
it('does not let a superseded read overwrite the latest mutation', async () => {
    let resolve!: (value: unknown[]) => void;
    (listReviewsForUser as jest.Mock).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const view = render(<ProgressWidgetSync />);
    act(() => notifyProgressChanged());
    await waitFor(() => expect(writeProgressWidget).toHaveBeenCalledTimes(1));
    await act(async () => { resolve([]); });
    expect(writeProgressWidget).toHaveBeenCalledTimes(1);
    view.unmount();
});
it('retains the last good timeline when reading reviews fails', async () => {
    (listReviewsForUser as jest.Mock).mockRejectedValue(new Error('offline'));
    const view = render(<ProgressWidgetSync />);
    await act(async () => {});
    expect(writeProgressWidget).not.toHaveBeenCalled();
    view.unmount();
});
