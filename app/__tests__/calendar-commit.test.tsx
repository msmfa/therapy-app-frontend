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
        LinearGradient: ({ children }: { children?: React.ReactNode }) =>
            ReactForMock.createElement(MockView, null, children),
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
        // The next-reminder card says which review moment it is, not just when.
        expect(screen.getByText('Evening before your next session')).toBeTruthy();
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

    it('deletes one appointment straight away but asks before ending a series', async () => {
        mockSessions = [session('s1', '2026-09-15T09:00:00.000Z', { seriesId: 'ser' })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        fireEvent.press(screen.getByText('delete-this'));
        await waitFor(() => expect(mockRemoveSession).toHaveBeenCalledWith('s1', 'this'));

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        fireEvent.press(screen.getByText('delete-future'));
        expect(mockRemoveSession).toHaveBeenCalledTimes(1);
        expect(mockShowAlert).toHaveBeenCalledWith('End this series?', expect.any(String), expect.objectContaining({
            primaryAction: expect.objectContaining({ label: 'End series', tone: 'danger' }),
        }));

        const options = mockShowAlert.mock.calls[0][2] as { primaryAction: { onPress: () => Promise<void> } };
        await options.primaryAction.onPress();
        expect(mockRemoveSession).toHaveBeenLastCalledWith('s1', 'future');
    });

    it('explains a reminder day instead of offering to book over it', () => {
        mockSessions = [session('s1', '2026-09-08T09:00:00.000Z')];
        mockReminders = [reminder('r1', '2026-09-14', { nextSessionId: 's2', sessionId: 's1' })];
        render(<CalendarScreen />);

        fireEvent.press(screen.getByTestId('therapy-calendar.day_2026-09-14'));

        expect(screen.getByTestId('reminder-sheet.r1')).toBeTruthy();
        expect(screen.getByText('EVENING BEFORE YOUR NEXT SESSION')).toBeTruthy();
        expect(screen.getByText('Scheduled')).toBeTruthy();
        expect(screen.getByText('After your session on Tue 8 Sep')).toBeTruthy();
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

        expect(screen.getByText('WRITE UP YOUR SESSION')).toBeTruthy();
        expect(screen.getByText('Missed')).toBeTruthy();
        expect(screen.queryByText('Add Session')).toBeNull();
    });

    it('tells the user when another device changed the calendar first', async () => {
        mockAddSession.mockRejectedValueOnce(new ApiError(412, { message: 'stale', code: 'calendar_changed' }));
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(<CalendarScreen />);

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText('add-weekly'));

        await waitFor(() => expect(mockShowAlert).toHaveBeenCalledWith('Calendar changed', expect.stringMatching(/another device/)));
        consoleError.mockRestore();
    });

    it('keeps initial loading inside the tab screen instead of opening a modal', () => {
        mockLoading = true;
        mockHydrated = false;
        render(<CalendarScreen />);

        expect(screen.getByText('loading:false')).toBeTruthy();
    });
});
