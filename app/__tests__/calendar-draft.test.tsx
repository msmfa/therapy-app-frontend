import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CALENDAR_MONTH_COLORS } from 'designs/designs-colors';

const mockSyncSessions = jest.fn();
let mockSessions: { _id: string; startsAtUtc: string }[] = [];

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
    useTherapySessions: () => ({
        sessions: mockSessions,
        syncSessions: mockSyncSessions,
        neuroReminders: [],
        loading: false,
        error: null,
        refreshSessions: jest.fn(),
    }),
}));

// The real sheet pulls in a date picker; this stand-in confirms a single
// session at 14:30 on the day it was opened for.
jest.mock('../../src/components/therapy-calendar/ScheduleModal', () => {
    const ReactModule = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return {
        __esModule: true,
        default: ({ visible, selectedDate, onConfirm }: {
            visible: boolean;
            selectedDate: string;
            onConfirm: (mode: 'single' | 'weekly_pattern', time: Date) => void;
        }) => (visible
            ? ReactModule.createElement(
                TouchableOpacity,
                { onPress: () => onConfirm('single', new Date('2000-01-01T14:30:00')) },
                ReactModule.createElement(Text, null, `sheet-for-${selectedDate}`),
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

jest.mock('../../src/components/ui/GlassButtonOutline', () => ({ GlassButtonOutline: () => null }));
jest.mock('../../src/components/ui/CalendarBackdrop', () => ({ CalendarBackdrop: () => null }));
jest.mock('../../src/components/ui/LoadingWithSuccess', () => () => null);
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: jest.fn() }) }));

import CalendarScreen from '../(tabs)/calendar';

const TODAY = new Date('2026-09-01T09:00:00Z');
const DAY_KEY = '2026-09-15';

const dayBackground = (dateKey: string) => StyleSheet.flatten(
    screen.getByTestId(`therapy-calendar.day_${dateKey}`).props.style as ViewStyle,
).backgroundColor;

describe('calendar edits before save', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSessions = [];
        jest.useFakeTimers();
        jest.setSystemTime(TODAY);
        mockSyncSessions.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('redraws the month with the new session as soon as the sheet confirms, and saves nothing', () => {
        render(<CalendarScreen />);

        expect(dayBackground(DAY_KEY)).toBeUndefined();

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText(`sheet-for-${DAY_KEY}`));

        expect(dayBackground(DAY_KEY)).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(mockSyncSessions).not.toHaveBeenCalled();
    });

    it('stores the drafted session only when Save is pressed', async () => {
        render(<CalendarScreen />);

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText(`sheet-for-${DAY_KEY}`));
        fireEvent.press(screen.getByLabelText('Save therapy sessions'));

        await waitFor(() => expect(mockSyncSessions).toHaveBeenCalledTimes(1));
        const saved = mockSyncSessions.mock.calls[0][0] as Record<string, Date>;
        expect(Object.keys(saved)).toEqual([DAY_KEY]);
        expect(saved[DAY_KEY].getHours()).toBe(14);
    });

    it('shows a changed time on the next-session card before it is saved', () => {
        mockSessions = [{ _id: 's1', startsAtUtc: '2026-09-15T09:00:00.000Z' }];
        render(<CalendarScreen />);

        const before = screen.getByText(/^Tue, /).props.children as string;

        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${DAY_KEY}`));
        fireEvent.press(screen.getByText(`sheet-for-${DAY_KEY}`));

        const after = screen.getByText(/^Tue, /).props.children as string;
        expect(after).not.toBe(before);
        expect(after).toMatch(/2:30|14:30/);
        expect(dayBackground(DAY_KEY)).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(mockSyncSessions).not.toHaveBeenCalled();
    });
});
