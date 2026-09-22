/**
 * A session day wears its own disc (sessionFill); today and a plain reminder
 * still wear the today/dot treatment these tests were originally written for.
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

import { CalendarDay } from '../CalendarDay';
import { CALENDAR_MONTH_COLORS } from 'designs/designs-colors';

const renderDay = (props: Partial<React.ComponentProps<typeof CalendarDay>> = {}) =>
    render(
        <CalendarDay testID="day" state="today" { ...props }>
            18
        </CalendarDay>,
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

describe('CalendarDay', () => {
    it('wears its own disc when today also carries a session, in place of the today disc', () => {
        renderDay({ marking: { kind: 'session' } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(dotColours()).toEqual(Array(3).fill('transparent'));
    });

    it('lightens a reminder dot on today, which is nearly black behind it', () => {
        renderDay({ marking: { kind: 'reminder' } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_MONTH_COLORS.todayBackground);
        expect(dotColours()).toEqual(Array(3).fill(CALENDAR_MONTH_COLORS.reminderDotOnToday));
        // The month's blue is far too dark to read on the disc; if these ever
        // collapse to one value the dots have gone invisible again.
        expect(CALENDAR_MONTH_COLORS.reminderDotOnToday)
            .not.toBe(CALENDAR_MONTH_COLORS.reminderDot);
    });

    it('still shows the disc on a today with nothing on it', () => {
        renderDay();

        expect(cellStyle().backgroundColor).toBe(CALENDAR_MONTH_COLORS.todayBackground);
        expect(dotColours()).toEqual(Array(3).fill('transparent'));
    });

    it('wears its disc on any other day too, not just today', () => {
        renderDay({ state: undefined, marking: { kind: 'session' } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(dotColours()).toEqual(Array(3).fill('transparent'));
    });

    it('sets the numeral to the fill\'s own text colour on a session day', () => {
        renderDay({ state: undefined, marking: { kind: 'session' } });

        const text = screen.getByText('18');
        expect(StyleSheet.flatten(text.props.style).color).toBe(CALENDAR_MONTH_COLORS.sessionFillText);
    });

    it('drops the session disc while the day is pressed, so the sheet owns the cell', () => {
        renderDay({ marking: { kind: 'session', pressed: true } });

        expect(cellStyle().backgroundColor).toBe(CALENDAR_MONTH_COLORS.pressedBackground);
    });

    it('leaves a reminder day without a disc, since only its dots distinguish it', () => {
        renderDay({ state: undefined, marking: { kind: 'reminder' } });

        expect(cellStyle().backgroundColor).toBeUndefined();
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
