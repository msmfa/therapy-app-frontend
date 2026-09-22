/**
 * The today disc and the session/reminder dots used to be mutually exclusive.
 *
 * `isTodayCell` required `!kind`, so the one day a user is most likely to look
 * at was the one day whose mark was dropped: a session this evening rendered as
 * a bare black circle, identical to a today with nothing on at all.
 *
 * These drive the day cell directly rather than through `Calendar`. The library
 * decides "today" with `xdate`, which binds the real `Date` at import and so
 * ignores `jest.setSystemTime`; a test that faked the clock and then looked for
 * a today cell would be asserting against whatever date the machine ran on.
 * Passing `state` in is the same input the library supplies, minus the clock.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { DarkCalendarDay } from '../DarkCalendarDay';
import { CALENDAR_DARK_COLORS } from 'designs/designs-colors';

const renderDay = (props: Partial<React.ComponentProps<typeof DarkCalendarDay>> = {}) =>
    render(
        <DarkCalendarDay testID="day" state="today" { ...props }>
            18
        </DarkCalendarDay>,
    );

const cellStyle = () => StyleSheet.flatten(
    screen.getByTestId('day').props.style as ViewStyle,
);

const dotColours = () => {
    const nodes: { props: { style?: ViewStyle } }[] = screen
        .getByTestId('day')
        .findAllByType(View);

    return nodes
        .map((node) => StyleSheet.flatten(node.props.style))
        .filter((style) => style?.width === 4 && style?.height === 4)
        .map((style) => style.backgroundColor);
};

describe('DarkCalendarDay', () => {
    it('keeps the today disc when today also carries a session', () => {
        renderDay({ marking: { kind: 'session' } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_DARK_COLORS.todayBackground);
        expect(dotColours()).toEqual(Array(3).fill(CALENDAR_DARK_COLORS.sessionDotOnToday));
    });

    it('lightens a reminder dot on today, which is nearly black behind it', () => {
        renderDay({ marking: { kind: 'reminder' } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_DARK_COLORS.todayBackground);
        expect(dotColours()).toEqual(Array(3).fill(CALENDAR_DARK_COLORS.reminderDotOnToday));
        // The month's blue is far too dark to read on the disc; if these ever
        // collapse to one value the dots have gone invisible again.
        expect(CALENDAR_DARK_COLORS.reminderDotOnToday)
            .not.toBe(CALENDAR_DARK_COLORS.reminderDot);
    });

    it('still shows the disc on a today with nothing on it', () => {
        renderDay();

        expect(cellStyle().backgroundColor).toBe(CALENDAR_DARK_COLORS.todayBackground);
        expect(dotColours()).toEqual(Array(3).fill('transparent'));
    });

    it('leaves every other day its own dot colours', () => {
        renderDay({ state: undefined, marking: { kind: 'session' } });

        expect(cellStyle().backgroundColor).toBeUndefined();
        expect(dotColours()).toEqual(Array(3).fill(CALENDAR_DARK_COLORS.sessionDot));
    });

    it('drops the disc while the day is pressed, so the sheet owns the cell', () => {
        renderDay({ marking: { kind: 'session', pressed: true } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_DARK_COLORS.pressedBackground);
        expect(dotColours()).toEqual(Array(3).fill(CALENDAR_DARK_COLORS.sessionDot));
    });

    it("builds VoiceOver's label from the date and what the day carries, since react-native-calendars never supplies one itself", () => {
        renderDay({
            date: { dateString: '2026-03-04', day: 4, month: 3, year: 2026, timestamp: 0 },
            marking: { kind: 'session' },
        });

        const label = screen.getByTestId('day').props.accessibilityLabel as string;
        expect(label).toContain('Today');
        expect(label).toContain('Therapy session');
        expect(label).toMatch(/Wednesday.*4.*March.*2026/);
    });

    it('names a reminder day without the word "Today" once it is no longer today', () => {
        renderDay({
            state: undefined,
            date: { dateString: '2026-03-04', day: 4, month: 3, year: 2026, timestamp: 0 },
            marking: { kind: 'reminder' },
        });

        const label = screen.getByTestId('day').props.accessibilityLabel as string;
        expect(label).not.toContain('Today');
        expect(label).toContain('Reminder');
    });

    it('lets a caller override the built label', () => {
        renderDay({ accessibilityLabel: 'Custom label' });

        expect(screen.getByTestId('day').props.accessibilityLabel).toBe('Custom label');
    });
});
