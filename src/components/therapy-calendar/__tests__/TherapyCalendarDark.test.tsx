import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TherapyCalendar from '../TherapyCalendar';
import { CALENDAR_DARK_COLORS } from 'designs/designs-colors';

// The real sheet pulls in a date picker. This stand-in keeps the two things
// the calendar is responsible for: the date it was handed, and the confirm
// callback that turns a press into a scheduled session.
jest.mock('../ScheduleModal', () => {
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

const TODAY = new Date('2026-09-01T09:00:00Z');
const SESSION_KEY = '2026-09-08';
const REMINDER_KEY = '2026-09-09';
// Falls before minDate, so the grid renders it disabled while it still carries
// a session.
const PAST_SESSION_KEY = '2026-08-31';

const renderCalendar = (onSelectedSessionsChange = jest.fn()) => ({
    onSelectedSessionsChange,
    ...render(
    <TherapyCalendar
        dotDates={ [REMINDER_KEY] }
        hideExtraDays={ false }
        onSelectedSessionsChange={ onSelectedSessionsChange }
        selectedSessions={ {
            [SESSION_KEY]: new Date('2026-09-08T09:00:00Z'),
            [PAST_SESSION_KEY]: new Date('2026-08-31T09:00:00Z'),
        } }
        variant="dark"
    />,
    ),
});

describe('TherapyCalendar dark variant', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(TODAY);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const dayStyle = (dateKey: string) => StyleSheet.flatten(
        screen.getByTestId(`therapy-calendar.day_${dateKey}`).props.style as ViewStyle,
    );

    /** The colour of the three dots a marked day carries under its numeral. */
    const dotColours = (dateKey: string) => {
        const nodes: { props: { style?: ViewStyle } }[] = screen
            .getByTestId(`therapy-calendar.day_${dateKey}`)
            .findAllByType(View);

        return nodes
            .map((node) => StyleSheet.flatten(node.props.style))
            .filter((style) => style?.width === 4 && style?.height === 4)
            .map((style) => style.backgroundColor);
    };

    it('marks sessions with orange dots and reminders with blue ones', () => {
        renderCalendar();

        expect(dotColours(SESSION_KEY)).toEqual(
            Array(3).fill(CALENDAR_DARK_COLORS.sessionDot),
        );
        expect(dotColours(REMINDER_KEY)).toEqual(
            Array(3).fill(CALENDAR_DARK_COLORS.reminderDot),
        );
    });

    it('reserves the dot row on every day so the numerals share a baseline', () => {
        renderCalendar();

        // An unmarked day still renders the row, transparent. Without it the
        // cell centres a shorter stack and its numeral sits lower than the rest.
        expect(dotColours('2026-09-14')).toEqual(Array(3).fill('transparent'));
        expect(dotColours(SESSION_KEY)).toHaveLength(3);
    });

    it('keeps a marked day readable when the grid renders it disabled', () => {
        renderCalendar();

        // The dots survive; the whole cell fades instead of the mark vanishing.
        expect(dotColours(PAST_SESSION_KEY)).toHaveLength(3);
        expect(dayStyle(PAST_SESSION_KEY).opacity).toBeLessThan(1);
    });

    it('opens the schedule sheet for the day that was pressed', () => {
        renderCalendar();

        fireEvent.press(screen.getByText('15'));

        expect(screen.getByText('sheet-for-2026-09-15')).toBeTruthy();
    });

    it('reports the new session back to the caller when the sheet confirms', () => {
        // Save only lights up when the selection differs from what loaded, so
        // this callback firing is the whole chain that ungreys the button.
        const onSelectedSessionsChange = jest.fn();
        renderCalendar(onSelectedSessionsChange);

        fireEvent.press(screen.getByText('15'));
        fireEvent.press(screen.getByText('sheet-for-2026-09-15'));

        expect(onSelectedSessionsChange).toHaveBeenCalledTimes(1);
        const next = onSelectedSessionsChange.mock.calls[0][0] as Record<string, Date>;
        expect(Object.keys(next).sort()).toEqual([PAST_SESSION_KEY, SESSION_KEY, '2026-09-15']);
        expect(next['2026-09-15'].getHours()).toBe(14);
        expect(next['2026-09-15'].getMinutes()).toBe(30);
    });

    it('does not open the sheet for a day before the first allowed date', () => {
        renderCalendar();

        fireEvent.press(screen.getByText('31'));

        expect(screen.queryByText(/^sheet-for-/)).toBeNull();
    });
});
