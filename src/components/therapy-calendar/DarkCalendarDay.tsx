import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { CALENDAR_DARK_COLORS } from 'designs/designs-colors';
import { longDateLabel } from '../../features/onboarding/formatting';

export type DarkDayKind = 'session' | 'reminder';

export const DARK_DAY_SIZE = 40;

type Props = {
    date?: DateData;
    state?: string;
    marking?: {
        kind?: DarkDayKind;
        pressed?: boolean;
        // Carried so the calendar's own MarkingProps stays assignable to this
        // narrower view of it.
        marked?: boolean;
        disabled?: boolean;
    };
    onPress?: (date?: DateData) => void;
    accessibilityLabel?: string;
    testID?: string;
    children?: React.ReactNode;
};

const RADIUS = DARK_DAY_SIZE / 2;

const DOT_COUNT = 3;

// `date.dateString` is "YYYY-MM-DD". Built with the Date constructor directly
// it parses as UTC midnight, which lands on the wrong day near either end of
// a negative or positive time zone; the parts are read out and reassembled as
// local time instead, same as TherapyCalendar's own createDateFromKey.
function dateFromDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// A reminder is marked by three dots under the numeral rather than a disc
// behind it (a session gets its own disc — see sessionFill below); the month
// still reads as a plain grid of dates with nothing on it, most days.
//
// Rendered on every day, transparent where there is nothing to show, and
// positioned absolutely so it takes no space in the cell's column. In flow it
// weighed the same as the library's hidden dot did: the cell centres its
// contents, so anything below the numeral lifts the numeral off centre by half
// that thing's height, and the number sat high inside the today disc.
function DayDots({ color, inset = false }: { color: string; inset?: boolean }) {
    return (
        <View pointerEvents="none" style={ [styles.dotRow, inset && styles.dotRowInset] }>
            { Array.from({ length: DOT_COUNT }, (_unused, index) => (
                <View key={ index } style={ [styles.dot, { backgroundColor: color }] } />
            )) }
        </View>
    );
}

// Replaces the library's day so the numeral can sit dead centre. BasicDay
// always renders a 4pt dot under the text, invisible but not weightless, which
// lifts every number off centre by a couple of points.
export function DarkCalendarDay({ date, state, marking, onPress, accessibilityLabel, testID, children }: Props) {
    const { t } = useTranslation('calendar');
    const isDisabled = state === 'disabled';
    const kind = marking?.kind;
    const isPressed = Boolean(marking?.pressed);
    const isToday = state === 'today';
    // Today keeps its disc even when it is also a reminder, so the one day a
    // user is most likely to look at is never a plain black circle with
    // nothing under it, indistinguishable from a today with nothing on at
    // all. A session's own disc (below) still takes over on top of it: a
    // session is the more specific fact about the day, and its disc already
    // carries "this is a session" the way today's carries "this is today" —
    // the accessibility label carries both regardless of which disc is drawn.
    const isTodayCell = !isPressed && isToday;
    // The disc drops while the day is pressed, same as today's, so the sheet
    // opened on it owns the cell rather than competing with it.
    const showsSessionFill = kind === 'session' && !isPressed;

    // react-native-calendars calls this component directly as `dayComponent`,
    // so nothing upstream ever supplies `accessibilityLabel` in practice: it
    // exists so a caller (or a test) can still override it, but every real
    // day cell needs its label built here, from the same `date`/`marking` the
    // dots and the disc already read. Without it VoiceOver read only the bare
    // numeral, with no way to tell a session day from a reminder day or from
    // today.
    const defaultAccessibilityLabel = date === undefined
        ? undefined
        : [
            isToday ? t('a11y.today') : null,
            longDateLabel(dateFromDateString(date.dateString)),
            kind === 'session' ? t('a11y.therapySession') : kind === 'reminder' ? t('a11y.reminder') : null,
        ].filter((part): part is string => part !== null).join(', ');

    // Only a reminder still needs a dot colour — a session carries its kind in
    // its own disc (sessionFill) instead, which reads on any ground without a
    // separate "on today" variant the way a dot needs one.
    const dotColor = kind === 'reminder'
        ? (isTodayCell ? CALENDAR_DARK_COLORS.reminderDotOnToday : CALENDAR_DARK_COLORS.reminderDot)
        : undefined;

    const cellStyle = [
        styles.cell,
        // A marked day outside the month, or before the first bookable date,
        // keeps its dots and fades as a whole rather than losing them.
        isDisabled && Boolean(kind) && styles.cellDisabled,
        isPressed && styles.cellPressed,
        isTodayCell && styles.cellToday,
        showsSessionFill && { backgroundColor: CALENDAR_DARK_COLORS.sessionFill },
    ];

    const color = showsSessionFill
        ? CALENDAR_DARK_COLORS.sessionFillText
        : isTodayCell
            ? CALENDAR_DARK_COLORS.todayText
            : isDisabled && !kind
                ? CALENDAR_DARK_COLORS.dayDisabled
                : CALENDAR_DARK_COLORS.dayDefault;

    return (
        <TouchableOpacity
            accessibilityLabel={ accessibilityLabel ?? defaultAccessibilityLabel }
            accessibilityRole={ isDisabled ? undefined : 'button' }
            activeOpacity={ 0.7 }
            disabled={ isDisabled }
            onPress={ isDisabled ? undefined : () => onPress?.(date) }
            style={ cellStyle }
            testID={ testID }
        >
            { /*
                The numeral sits centred in a fixed 40pt circle with the
                dot row anchored underneath it, so it can't grow freely with
                Dynamic Type without colliding with the dots or the circle's
                edge. Capped rather than fixed, so most Larger Text settings
                still get some benefit here.
            */ }
            <Text
                maxFontSizeMultiplier={ 1.3 }
                style={ [styles.text, { color }] }
            >
                { children }
            </Text>
            <DayDots color={ dotColor ?? 'transparent' } inset={ isTodayCell } />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cell: {
        alignItems: 'center',
        borderRadius: RADIUS,
        height: DARK_DAY_SIZE,
        justifyContent: 'center',
        width: DARK_DAY_SIZE,
    },
    cellDisabled: {
        opacity: 0.45,
    },
    cellPressed: {
        backgroundColor: CALENDAR_DARK_COLORS.pressedBackground,
    },
    cellToday: {
        backgroundColor: CALENDAR_DARK_COLORS.todayBackground,
    },
    text: {
        fontFamily: 'System',
        fontSize: 17,
        fontWeight: CALENDAR_DARK_COLORS.dayFontWeight,
        includeFontPadding: false,
        textAlign: 'center',
    },
    // Out of flow, spanning the cell so the row centres on the numeral above it.
    dotRow: {
        alignItems: 'center',
        bottom: 3,
        flexDirection: 'row',
        gap: 3,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
    },
    // Inside the today disc the row lifts clear of the curve: 3pt from the
    // bottom of a 40pt circle leaves only about 21pt of width for an 18pt row,
    // so the dots would sit hard against the edge.
    dotRowInset: {
        bottom: 6,
    },
    dot: {
        borderRadius: 2,
        height: 4,
        width: 4,
    },
});
