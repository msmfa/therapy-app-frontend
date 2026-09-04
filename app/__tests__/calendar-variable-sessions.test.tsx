import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockSyncSessions = jest.fn();
let mockInitialSessions: Record<string, Date> = {};
let mockSessionsLoading = false;

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
        sessions: [],
        syncSessions: mockSyncSessions,
        neuroReminders: [],
        loading: mockSessionsLoading,
        error: null,
        refreshSessions: jest.fn(),
    }),
}));

jest.mock('../../src/utils/calendar', () => ({
    convertSessionsToCalendarFormat: () => mockInitialSessions,
}));

jest.mock('../../src/components/therapy-calendar/TherapyCalendar', () => {
    const ReactForMock = require('react');
    const { Text: MockText, TouchableOpacity: MockTouchableOpacity, View: MockView } =
        require('react-native');

    return ({ onSelectedSessionsChange }: {
        onSelectedSessionsChange: (sessions: Record<string, Date>) => void;
    }) => ReactForMock.createElement(
        MockView,
        null,
        ReactForMock.createElement(
            MockTouchableOpacity,
            {
                onPress: () => onSelectedSessionsChange({
                    '2026-09-08': new Date('2026-09-08T17:00:00.000Z'),
                }),
            },
            ReactForMock.createElement(MockText, null, 'Choose one session'),
        ),
        ReactForMock.createElement(
            MockTouchableOpacity,
            { onPress: () => onSelectedSessionsChange({}) },
            ReactForMock.createElement(MockText, null, 'Choose no sessions'),
        ),
    );
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

jest.mock('../../src/components/ui/GlassButtonOutline', () => ({
    GlassButtonOutline: () => null,
}));

jest.mock('../../src/components/ui/DarkBackdrop', () => ({
    DarkBackdrop: () => null,
}));

jest.mock('../../src/components/ui/LoadingWithSuccess', () => () => null);

jest.mock('../../src/components/ui/Loading', () => {
    const ReactForMock = require('react');
    const { Text: MockText } = require('react-native');
    return ({ fullScreen }: { fullScreen?: boolean }) =>
        ReactForMock.createElement(MockText, null, `loading:${String(fullScreen)}`);
});

jest.mock('../../src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: jest.fn() }),
}));

import CalendarScreen from '../(tabs)/calendar';

describe('calendar session counts accepted by onboarding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInitialSessions = {};
        mockSessionsLoading = false;
        mockSyncSessions.mockResolvedValue(undefined);
    });

    it('saves a single irregular session', async () => {
        const { getByLabelText, getByText } = render(<CalendarScreen />);

        fireEvent.press(getByText('Choose one session'));
        fireEvent.press(getByLabelText('Save therapy sessions'));

        await waitFor(() => expect(mockSyncSessions).toHaveBeenCalledWith(
            { '2026-09-08': new Date('2026-09-08T17:00:00.000Z') },
            50,
        ));
    });

    it('can save an empty selection to remove the remaining sessions', async () => {
        mockInitialSessions = {
            '2026-09-08': new Date('2026-09-08T17:00:00.000Z'),
        };
        const { getByLabelText, getByText } = render(<CalendarScreen />);

        fireEvent.press(getByText('Choose no sessions'));
        fireEvent.press(getByLabelText('Save therapy sessions'));

        await waitFor(() => expect(mockSyncSessions).toHaveBeenCalledWith({}, 50));
    });

    it('keeps initial loading inside the tab screen instead of opening a modal', () => {
        mockSessionsLoading = true;

        const { getByText } = render(<CalendarScreen />);

        expect(getByText('loading:false')).toBeTruthy();
    });
});
