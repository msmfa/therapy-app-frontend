import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CALENDAR_MONTH_COLORS } from 'designs/designs-colors';
import type { CalendarReminder, TherapySession } from '../../src/api/therapy';
import { ApiError } from '../../src/api/client';
import { Reason } from '../../src/features/reminders/types';

const mockAddSession = jest.fn();
const mockUpdateSession = jest.fn();
const mockRemoveSession = jest.fn();
const mockShowAlert = jest.fn();
const mockUpdateCurrentUser = jest.fn();
const mockRefreshReminderSchedule = jest.fn();
let mockSessions: TherapySession[] = [];
let mockReminders: CalendarReminder[] = [];
let mockLoading = false;
let mockHydrated = true;

jest.mock('expo-router', () => ({
    useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return {
        SafeAreaView: ({ children }: { children: React.ReactNode }) =>
            ReactForMock.createElement(MockView, null, children),
        useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    };
});

jest.mock('@react-native-masked-view/masked-view', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return ({ children }: { children: React.ReactNode }) =>
        ReactForMock.createElement(MockView, null, children);
});

jest.mock('expo-linear-gradient', () => {
    const ReactForMock = require('react');
    const { View: MockView } = require('react-native');
    return {
        LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) =>
            ReactForMock.createElement(MockView, props, children),
    };
});

jest.mock('../../src/context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => {
        const editable = mockSessions.filter((s) => new Date(s.startsAtUtc).getTime() >= Date.now() - 12 * 60 * 60 * 1000);
        const pending = mockReminders.filter((r) => r.status === 'pending');
        return {
            sessions: editable,
            scheduleSessions: mockSessions,
            reminders: mockReminders,
            nextSession: editable[0] ?? null,
            nextReminder: pending[0] ?? null,
            hydrated: mockHydrated,
            loading: mockLoading,
            error: null,
            refreshSessions: jest.fn(),
            refreshReminderSchedule: mockRefreshReminderSchedule,
            reminderScheduleSettings: {
                timeZone: 'Europe/London',
                morningReminderMinutes: 7 * 60,
                eveningReminderMinutes: 20 * 60,
            },
            addSession: mockAddSession,
            updateSession: mockUpdateSession,
            removeSession: mockRemoveSession,
        };
    },
}));

// The real sheet pulls in a date picker; this stand-in exposes the three
// commits with a fixed 14:30 time and reports which day it was opened for.
jest.mock('../../src/components/therapy-calendar/ScheduleModal', () => {
    const ReactModule = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return {
        __esModule: true,
        default: ({ visible, selectedDate, existingSession, onAdd, onUpdate, onDelete }: {
            visible: boolean;
            selectedDate: string;
            existingSession: { id: string; inSeries: boolean } | null;
            onAdd: (mode: string, time: Date) => void;
            onUpdate: (time: Date, scope: string) => void;
            onDelete: (scope: string) => void;
        }) => (visible
            ? ReactModule.createElement(View, null,
                ReactModule.createElement(Text, null, `sheet-for-${selectedDate}${existingSession ? `:${existingSession.id}${existingSession.inSeries ? ':series' : ''}` : ''}`),
                ReactModule.createElement(TouchableOpacity, { onPress: () => onAdd('weekly', new Date('2000-01-01T14:30:00')) },
                    ReactModule.createElement(Text, null, 'add-weekly')),
                ReactModule.createElement(TouchableOpacity, { onPress: () => onUpdate(new Date('2000-01-01T14:30:00'), 'future') },
                    ReactModule.createElement(Text, null, 'update-future')),
                ReactModule.createElement(TouchableOpacity, { onPress: () => onDelete('this') },
                    ReactModule.createElement(Text, null, 'delete-this')),
                ReactModule.createElement(TouchableOpacity, { onPress: () => onDelete('future') },
                    ReactModule.createElement(Text, null, 'delete-future')),
            )
            : null),
    };
});

jest.mock('../../src/components/ui/GlassPillButton', () => {
    const ReactForMock = require('react');
    const { Text: MockText, TouchableOpacity: MockTouchableOpacity } = require('react-native');
    return {
        GlassPillButton: ({ accessibilityLabel, disabled, label, onPress }: {
            accessibilityLabel?: string;
            disabled?: boolean;
            label: string;
            onPress: () => void;
        }) => ReactForMock.createElement(
            MockTouchableOpacity,
            { accessibilityLabel, accessibilityRole: 'button', disabled, onPress },
            ReactForMock.createElement(MockText, null, label),
        ),
    };
});

jest.mock('../../src/components/ui/CalendarBackdrop', () => ({ CalendarBackdrop: () => null }));
jest.mock('../../src/components/ui/Loading', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return ({ fullScreen }: { fullScreen?: boolean }) =>
        ReactForMock.createElement(MockText, null, `loading:${String(fullScreen)}`);
});
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: mockShowAlert }) }));
jest.mock('../../src/api/users', () => ({ updateCurrentUser: (...args: unknown[]) => mockUpdateCurrentUser(...args) }));

// The real one pulls in the native date picker; this stand-in reports which
// slot it was opened on and commits a fixed 21:15.
jest.mock('../../src/components/therapy-calendar/ReminderTimeSheet', () => {
    const ReactModule = require('react');
    const { Text, TouchableOpacity, View } = require('react-native');
    return {
        __esModule: true,
        default: ({ visible, slot, minutes, onSave, onCancel }: {
            visible: boolean;
            slot: string;
            minutes: number;
            onSave: (minutes: number) => void;
            onCancel: () => void;
        }) => (visible
            ? ReactModule.createElement(View, null,
                ReactModule.createElement(Text, null, `time-sheet:${slot}:${minutes}`),
                ReactModule.createElement(TouchableOpacity, { onPress: () => onSave(21 * 60 + 15) },
                    ReactModule.createElement(Text, null, 'save-time')),
                ReactModule.createElement(TouchableOpacity, { onPress: onCancel },
                    ReactModule.createElement(Text, null, 'cancel-time')),
            )
            : null),
    };
});

import CalendarScreen from '../(tabs)/calendar';

const TODAY = new Date('2026-09-01T09:00:00Z');
const DAY_KEY = '2026-09-15';

const session = (id: string, startsAtUtc: string, extra: Partial<TherapySession> = {}): TherapySession =>
    ({ _id: id, startsAtUtc, durationMin: 50, ...extra });

const reminder = (id: string, localDate: string, extra: Partial<CalendarReminder> = {}): CalendarReminder => ({
    id, kind: 'review_note', reason: Reason.PreSession, dueAtUtc: `${localDate}T19:00:00.000Z`, localDate,
    sessionId: 's1', status: 'pending', ...extra,
});

const dayBackground = (dateKey: string) => StyleSheet.flatten(
    screen.getByTestId(`therapy-calendar.day_${dateKey}`).props.style as ViewStyle,
).backgroundColor;

describe('calendar edits commit as they are made', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSessions = [];
        mockReminders = [];
        mockLoading = false;
        mockHydrated = true;
        jest.useFakeTimers();
        jest.setSystemTime(TODAY);
        mockAddSession.mockResolvedValue(undefined);
        mockUpdateCurrentUser.mockResolvedValue(undefined);
        mockRefreshReminderSchedule.mockResolvedValue(undefined);
        mockUpdateSession.mockResolvedValue(undefined);
        mockRemoveSession.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('adds a weekly series the moment the sheet confirms, with no save step', async () => {
        render(<CalendarScreen />);
        expect(dayBackground(DAY_KEY)).toBeUndefined();

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText('add-weekly'));

        await waitFor(() => expect(mockAddSession).toHaveBeenCalledTimes(1));
        const input = mockAddSession.mock.calls[0][0] as { startsAtUtc: Date; durationMin: number; repeat?: string };
        expect(input.repeat).toBe('weekly');
        expect(input.durationMin).toBe(50);
        expect(input.startsAtUtc.getDate()).toBe(15);
        expect(input.startsAtUtc.getHours()).toBe(14);
        expect(input.startsAtUtc.getMinutes()).toBe(30);
        expect(screen.queryByText(/^Save/)).toBeNull();
        await waitFor(() => expect(screen.queryByText(`sheet-for-${DAY_KEY}`)).toBeNull());
    });

    it('draws the month from the calendar the server holds', () => {
        mockSessions = [session('s1', '2026-09-15T09:00:00.000Z', { seriesId: 'ser' })];
        mockReminders = [reminder('r1', '2026-09-14')];
        render(<CalendarScreen />);

        expect(dayBackground(DAY_KEY)).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(screen.getByText(/^Tue, /)).toBeTruthy();
        // The card is a readout of when, not a paraphrase of the sheet: the
        // headline it used to print lives in the sheet the card now opens.
        expect(screen.queryByText('Evening before your next session')).toBeNull();
    });

    it('opens an existing series session for editing and passes the scope through', async () => {
        mockSessions = [session('s1', '2026-09-15T09:00:00.000Z', { seriesId: 'ser' })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        expect(screen.getByText(`sheet-for-${DAY_KEY}:s1:series`)).toBeTruthy();
        fireEvent.press(screen.getByText('update-future'));

        await waitFor(() => expect(mockUpdateSession).toHaveBeenCalledTimes(1));
        const [id, input] = mockUpdateSession.mock.calls[0] as [string, { startsAtUtc: Date; scope: string }];
        expect(id).toBe('s1');
        expect(input.scope).toBe('future');
        expect(input.startsAtUtc.getHours()).toBe(14);
    });

    // The sheet is what asks before ending a series now, inside its own
    // modal. Raising the app-wide alert from here put a second modal beside
    // the sheet's, which iOS refuses to present and never retries: the
    // question was never seen and the button did nothing.
    it('passes a delete straight through, at whichever scope the sheet confirmed', async () => {
        mockSessions = [session('s1', '2026-09-15T09:00:00.000Z', { seriesId: 'ser' })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        fireEvent.press(screen.getByText('delete-this'));
        await waitFor(() => expect(mockRemoveSession).toHaveBeenCalledWith('s1', 'this'));

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        fireEvent.press(screen.getByText('delete-future'));
        await waitFor(() => expect(mockRemoveSession).toHaveBeenLastCalledWith('s1', 'future'));
        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('explains a reminder day instead of offering to book over it', () => {
        mockSessions = [
            session('s1', '2026-09-08T09:00:00.000Z'),
            session('s2', '2026-09-15T09:00:00.000Z'),
        ];
        mockReminders = [reminder('r1', '2026-09-14', { nextSessionId: 's2', sessionId: 's1' })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('therapy-calendar.day_2026-09-14'));

        expect(screen.getByTestId('reminder-sheet.r1')).toBeTruthy();
        // The headline says which moment it is; the session it is about sits
        // beside the time, rather than in the headline or at the foot.
        expect(screen.getByText('EVENING BEFORE YOUR NEXT SESSION')).toBeTruthy();
        expect(screen.getByText('Tue 15 Sep')).toBeTruthy();
        expect(screen.queryByText(/^After your session on/)).toBeNull();
        // A reminder still to come offers the edit rather than restating that
        // it is scheduled, which the time underneath already says.
        expect(screen.getByTestId('reminder-sheet.r1.update')).toBeTruthy();
        expect(screen.queryByText('Scheduled')).toBeNull();
        expect(screen.queryByText(/^sheet-for-/)).toBeNull();

        // The dot is not a dead end: the day can still be booked from here.
        fireEvent.press(screen.getByText('Add Session'));
        expect(screen.getByText('sheet-for-2026-09-14')).toBeTruthy();
    });

    it('shows what became of a reminder that has already fired', () => {
        mockReminders = [reminder('r0', '2026-08-25', { status: 'missed', kind: 'log_note', reason: undefined })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('therapy-calendar.header.leftArrow', { includeHiddenElements: true }));
        fireEvent.press(screen.getByTestId('therapy-calendar.day_2026-08-25'));

        expect(screen.getByText('TAKE A POST-SESSION NOTE')).toBeTruthy();
        expect(screen.getByText('Missed')).toBeTruthy();
        expect(screen.queryByText('Add Session')).toBeNull();
    });

    it('sends the user to the day when they press the next session, since every edit belongs to its date', () => {
        mockSessions = [session('s1', '2026-10-06T09:00:00.000Z')];
        render(<CalendarScreen />);
        expect(screen.getByText(/September/, { includeHiddenElements: true })).toBeTruthy();

        fireEvent.press(screen.getByTestId('calendar.nextSession'));

        // The month moves to the session, and the sheet says what to do there.
        expect(screen.getByText(/October/, { includeHiddenElements: true })).toBeTruthy();
        expect(screen.queryByText(/September/, { includeHiddenElements: true })).toBeNull();
        expect(screen.queryByTestId('calendar-hint')).toBeNull();
        expect(mockShowAlert).not.toHaveBeenCalled();
        expect(screen.queryByText(/^sheet-for-/)).toBeNull();

    });

    it('opens the reminder day from the next-reminder card, the same sheet the day itself opens', () => {
        mockReminders = [reminder('r1', '2026-09-14')];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('calendar.nextReminder'));

        expect(screen.getByTestId('reminder-sheet.r1')).toBeTruthy();
        expect(screen.getByText('EVENING BEFORE YOUR NEXT SESSION')).toBeTruthy();
        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('leaves both cards inert while there is nothing scheduled to open', () => {
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('calendar.nextSession'));
        fireEvent.press(screen.getByTestId('calendar.nextReminder'));

        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('moves every evening reminder when one evening reminder is retimed, and says so before it does', async () => {
        mockReminders = [reminder('r1', '2026-09-14')];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('therapy-calendar.day_2026-09-14'));
        fireEvent.press(screen.getByTestId('reminder-sheet.r1.update'));

        // The evening slot, opened on the time it currently holds.
        expect(screen.getByText(`time-sheet:evening:${20 * 60}`)).toBeTruthy();

        fireEvent.press(screen.getByText('save-time'));

        await waitFor(() => expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ eveningReminderMinutes: 21 * 60 + 15 }));
        // The sessions did not move, so nothing else would invalidate the
        // cached schedule.
        await waitFor(() => expect(mockRefreshReminderSchedule).toHaveBeenCalledTimes(1));
        // The card that was edited stays up, showing the time it now has.
        expect(screen.getByTestId('reminder-sheet.r1')).toBeTruthy();
    });

    it('takes the morning slot from the morning reminder, not the evening one', () => {
        mockReminders = [reminder('r1', '2026-09-14', { reason: Reason.PostSleep })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('therapy-calendar.day_2026-09-14'));
        fireEvent.press(screen.getByTestId('reminder-sheet.r1.update'));

        expect(screen.getByText(`time-sheet:morning:${7 * 60}`)).toBeTruthy();
    });

    it('calls the post-session note a fixed time, since it moves only when the session does', () => {
        mockSessions = [session('s1', '2026-09-14T09:00:00.000Z')];
        mockReminders = [reminder('r1', '2026-09-14', { kind: 'log_note', reason: undefined })];
        render(<CalendarScreen />);

        // Through the card: the day itself belongs to the session that is on
        // it, so pressing the date opens the scheduler rather than the sheet.
        fireEvent.press(screen.getByTestId('calendar.nextReminder'));

        expect(screen.getByText('Fixed Time')).toBeTruthy();
        expect(screen.queryByTestId('reminder-sheet.r1.update')).toBeNull();
    });

    it('tells the user when another device changed the calendar first', async () => {
        mockAddSession.mockRejectedValueOnce(new ApiError(412, { message: 'stale', code: 'calendar_changed' }));
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<CalendarScreen />);

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText('add-weekly'));

        await waitFor(() => expect(mockShowAlert).toHaveBeenCalledWith('Calendar changed', expect.stringMatching(/another device/)));
        // The sheet goes first. The alert is a modal, and iOS will not
        // present one over the sheet's: left open, the message would be
        // dropped and the sheet would sit there having done nothing.
        await waitFor(() => expect(screen.queryByText(/^sheet-for-/)).toBeNull());
        consoleError.mockRestore();
    });

    it('fades overflowing content and removes the fade at the bottom', () => {
        render(<CalendarScreen />);
        const scroll = screen.getByTestId('calendar.scroll');
        fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 600 } } });
        fireEvent(scroll, 'contentSizeChange', 390, 800);
        expect(screen.getByTestId('calendar.bottomFade')).toBeTruthy();
        fireEvent.scroll(scroll, { nativeEvent: { contentOffset: { y: 200 } } });
        expect(screen.queryByTestId('calendar.bottomFade')).toBeNull();
        fireEvent(scroll, 'contentSizeChange', 390, 500);
        expect(screen.queryByTestId('calendar.bottomFade')).toBeNull();
    });

    it('keeps initial loading inside the tab screen instead of opening a modal', () => {
        mockLoading = true;
        mockHydrated = false;
        render(<CalendarScreen />);

        expect(screen.getByText('loading:true')).toBeTruthy();
    });
});
