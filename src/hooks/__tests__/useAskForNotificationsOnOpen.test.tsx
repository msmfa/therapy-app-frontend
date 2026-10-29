import { renderHook } from '@testing-library/react-native';
import { useAskForNotificationsOnOpen } from '../useAskForNotificationsOnOpen';

// Asks once the calendar has loaded and shows a reminder still to come, which
// is what reaches a reinstall or a new phone that never adds a session.

const mockAskOnOpen = jest.fn();
let mockCalendar: { hydrated: boolean; nextReminder: { id: string } | null };

jest.mock('../../services/notifications/permission', () => ({
    askForNotificationsOnOpen: () => mockAskOnOpen(),
}));

jest.mock('../../context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => mockCalendar,
}));

beforeEach(() => {
    jest.clearAllMocks();
    mockAskOnOpen.mockResolvedValue(undefined);
});

it('asks once the calendar shows a reminder to come', () => {
    mockCalendar = { hydrated: true, nextReminder: { id: 'r1' } };

    renderHook(() => useAskForNotificationsOnOpen());

    expect(mockAskOnOpen).toHaveBeenCalledTimes(1);
});

it('waits for the calendar to load before deciding', () => {
    mockCalendar = { hydrated: false, nextReminder: null };
    const { rerender } = renderHook(() => useAskForNotificationsOnOpen());
    expect(mockAskOnOpen).not.toHaveBeenCalled();

    mockCalendar = { hydrated: true, nextReminder: { id: 'r1' } };
    rerender({});

    expect(mockAskOnOpen).toHaveBeenCalledTimes(1);
});

it('does not ask when there is no reminder to come', () => {
    mockCalendar = { hydrated: true, nextReminder: null };

    renderHook(() => useAskForNotificationsOnOpen());

    expect(mockAskOnOpen).not.toHaveBeenCalled();
});

it('does not ask again when the next reminder changes', () => {
    mockCalendar = { hydrated: true, nextReminder: { id: 'r1' } };
    const { rerender } = renderHook(() => useAskForNotificationsOnOpen());

    mockCalendar = { hydrated: true, nextReminder: { id: 'r2' } };
    rerender({});

    expect(mockAskOnOpen).toHaveBeenCalledTimes(1);
});
