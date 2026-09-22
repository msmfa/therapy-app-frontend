import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import TherapyCalendar from '../TherapyCalendar';
import { CALENDAR_MONTH_COLORS } from 'designs/designs-colors';
import type { CalendarReminder, TherapySession } from '../../../api/therapy';
import { Reason } from '../../../features/reminders/types';

const TODAY = new Date('2026-09-01T09:00:00Z');
const SESSION_KEY = '2026-09-08';
const REMINDER_KEY = '2026-09-09';
// Yesterday: still inside the fetched range, so it is drawn and pressable,
// but faded because nothing on it can be changed any more.
const PAST_SESSION_KEY = '2026-08-31';
// Before the fetched range: the grid disables it outright.
const ANCIENT_KEY = '2026-05-01';

const session = (id: string, startsAtUtc: string, extra: Partial<TherapySession> = {}): TherapySession =>
    ({ _id: id, startsAtUtc, durationMin: 50, ...extra });

const reminder = (id: string, localDate: string, extra: Partial<CalendarReminder> = {}): CalendarReminder => ({
    id, kind: 'review_note', reason: Reason.PreSession, dueAtUtc: `${localDate}T19:00:00.000Z`, localDate,
    sessionId: 's1', status: 'pending', ...extra,
});

const renderCalendar = (onDayPress = jest.fn()) => ({
    onDayPress,
    ...render(
        <TherapyCalendar
            sessions={ [
                session('s1', '2026-09-08T09:00:00Z', { seriesId: 'ser' }),
                session('s0', '2026-08-31T09:00:00Z'),
            ] }
            reminders={ [
                reminder('r1', REMINDER_KEY),
                reminder('r0', SESSION_KEY, { reason: Reason.PostSession }),
            ] }
            onDayPress={ onDayPress }
        />,
    ),
});

describe('TherapyCalendar month grid', () => {
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

    it('marks a session with its own orange disc, and a reminder with blue dots', () => {
        renderCalendar();

        expect(dayStyle(SESSION_KEY).backgroundColor).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(dotColours(REMINDER_KEY)).toEqual(Array(3).fill(CALENDAR_MONTH_COLORS.reminderDot));
        expect(dayStyle(REMINDER_KEY).backgroundColor).toBeUndefined();
    });

    it('shows the dots on a session day too, in the ink of the disc', () => {
        renderCalendar();

        // The post-session review lands on the evening of the session itself,
        // so the disc has to be able to carry the dots without losing them.
        expect(dotColours(SESSION_KEY)).toEqual(Array(3).fill(CALENDAR_MONTH_COLORS.sessionFillText));
    });

    it('reserves the dot row on every day so the numerals share a baseline', () => {
        renderCalendar();

        expect(dotColours('2026-09-14')).toEqual(Array(3).fill('transparent'));
    });

    it('fades the past without hiding what was on it', () => {
        renderCalendar();

        expect(dayStyle(PAST_SESSION_KEY).backgroundColor).toBe(CALENDAR_MONTH_COLORS.sessionFill);
        expect(dayStyle(PAST_SESSION_KEY).opacity).toBeLessThan(1);
        expect(dayStyle(SESSION_KEY).opacity ?? 1).toBe(1);
    });

    it('reports the pressed day, past days included', () => {
        const { onDayPress } = renderCalendar();

        fireEvent.press(screen.getByText('15'));
        // Yesterday sits in last month's grid, so step back to it first.
        fireEvent.press(screen.getByTestId('therapy-calendar.header.leftArrow', { includeHiddenElements: true }));
        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${PAST_SESSION_KEY}`));

        expect(onDayPress).toHaveBeenNthCalledWith(1, '2026-09-15');
        expect(onDayPress).toHaveBeenNthCalledWith(2, PAST_SESSION_KEY);
    });

    it('labels a day for VoiceOver with what is on it', () => {
        renderCalendar();

        const label = screen.getByTestId(`therapy-calendar.day_${SESSION_KEY}`).props.accessibilityLabel as string;
        expect(label).toMatch(/Therapy session/);
        expect(label).toMatch(/Reminder/);
    });

    it('does not report a day before the fetched range', () => {
        const { onDayPress } = renderCalendar();

        // Walk back to May, four months before today.
        for (let month = 0; month < 4; month += 1) {
            fireEvent.press(screen.getByTestId('therapy-calendar.header.leftArrow', { includeHiddenElements: true }));
        }
        fireEvent.press(screen.getByTestId(`therapy-calendar.day_${ANCIENT_KEY}`));

        expect(onDayPress).not.toHaveBeenCalled();
    });
});
