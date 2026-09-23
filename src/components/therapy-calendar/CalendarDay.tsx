import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { longDateLabel } from '../../features/onboarding/formatting';

export type CalendarDayKind = 'session' | 'reminder';

export const CALENDAR_DAY_SIZE = 40;

type Props = {
    date?: DateData;
    state?: string;
    marking?: {
        kind?: CalendarDayKind;
        /** A reminder is due on the day; drawn as dots unless a session owns it. */
        reminder?: boolean;
        /** Before today: drawn faded, still pressable so its history can be read. */
        muted?: boolean;
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

const RADIUS = CALENDAR_DAY_SIZE / 2;

const DOT_COUNT = 3;

// `date.dateString` is "YYYY-MM-DD". Built with the Date constructor directly
// it parses as UTC midnight, which lands on the wrong day near either end of
// a negative or positive time zone; the parts are read out and reassembled as
// local time instead, same as TherapyCalendar's own createDateFromKey.
function dateFromDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// A reminder is marked by three dots under the numeral rather than a disc
// behind it (a session gets its own disc, sessionFill); the month still reads
// as a plain grid of dates with nothing on it, most days.
//
// Rendered on every day, transparent where there is nothing to show, and
// positioned absolutely so it takes no space in the cell's column. In flow it
// weighed the same as the library's hidden dot did: the cell centres its
// contents, so anything below the numeral lifts the numeral off centre by half
// that thing's height, and the number sat high inside the today disc.
function DayDots({ color, inset = false }: { color: string; inset?: boolean }) {
    const styles = useThemedStyles(makeStyles);
    return (
        <View pointerEvents="none" style={ [styles.dotRow, inset && styles.dotRowInset] }>
            { Array.from({ length: DOT_COUNT }, (_unused, index) => (
                <View key={ index } style={ [styles.dot, { backgroundColor: color }] } />
            )) }
        </View>
    );
}

/**
 * The month grid's own day cell, used when the calendar sits straight on the
 * backdrop. Replaces the library's day so the numeral can sit dead centre:
 * BasicDay always renders a 4pt dot under the text, invisible but not
 * weightless, which lifts every number off centre by a couple of points.
 *
 * Every colour comes from theme.calendar.month: near-black ink on the pale
 * sheet by day, near-white on the charcoal at night.
 */
export function CalendarDay({ date, state, marking, onPress, accessibilityLabel, testID, children }: Props) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const month = theme.calendar.month;
    const isDisabled = state === 'disabled';
    const kind = marking?.kind;
    const hasReminder = kind === 'reminder' || Boolean(marking?.reminder);
    const isMuted = Boolean(marking?.muted);
    const isPressed = Boolean(marking?.pressed);
    const isToday = state === 'today';
    // Today keeps its disc even when it is also a reminder, so the one day a
    // user is most likely to look at is never a plain circle with nothing
    // under it, indistinguishable from a today with nothing on at all. A
    // session's own disc (below) still takes over on top of it: a session is
    // the more specific fact about the day, and its disc already carries
    // "this is a session" the way today's carries "this is today"; the
    // accessibility label carries both regardless of which disc is drawn.
    const isTodayCell = !isPressed && isToday;
    // The month used to start at today, so react-native-calendars greyed
    // everything behind it out of the box. The past is navigable now, which
    // handed every gone day the same ink as a day still to come. It is still
    // pressable; it just no longer looks like something to act on.
    const isPast = date !== undefined
        && dateFromDateString(date.dateString).getTime() < startOfToday().getTime();
    // The disc drops while the day is pressed, same as today's, so the sheet
    // opened on it owns the cell rather than competing with it.
    const showsSessionFill = kind === 'session' && !isPressed;

    // react-native-calendars hands every day cell a label of its own, and it
    // is the bare date: no session, no reminder, no today. The label built
    // here reads the same `date`/`marking` the dots and the disc do, so it
    // says what is on the day, and it wins whenever there is a date to build
    // it from. The prop remains for a caller without one.
    const defaultAccessibilityLabel = date === undefined
        ? undefined
        : [
            isToday ? t('a11y.today') : null,
            longDateLabel(dateFromDateString(date.dateString)),
            kind === 'session' ? t('a11y.therapySession') : null,
            hasReminder ? t('a11y.reminder') : null,
        ].filter((part): part is string => part !== null).join(', ');

    // A reminder is dots, but only on a day that carries no session of its
    // own. The post-session review lands on the evening of the session itself,
    // so nearly every session day also has a reminder: the dots were on the
    // disc more often than not, and said nothing the disc had not already
    // said. The sheet still lists the day's reminders when the day is opened,
    // and the accessibility label still names them.
    const showsDots = hasReminder && kind !== 'session';
    const dotColor = !showsDots
        ? undefined
        : isTodayCell ? month.reminderDotOnToday : month.reminderDot;

    const cellStyle = [
        styles.cell,
        // A marked day outside the month, or before the first bookable date,
        // keeps its dots and fades as a whole rather than losing them.
        (isMuted || (isDisabled && Boolean(kind))) && styles.cellDisabled,
        isPressed && styles.cellPressed,
        isTodayCell && styles.cellToday,
        showsSessionFill && { backgroundColor: month.sessionFill },
    ];

    const color = showsSessionFill
        ? month.sessionFillText
        : isTodayCell
            ? month.todayText
            : (isDisabled || isPast) && !kind
                ? month.dayDisabled
                : month.dayDefault;

    return (
        <TouchableOpacity
            accessibilityLabel={ defaultAccessibilityLabel ?? accessibilityLabel }
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

const makeStyles = (theme: Theme) => StyleSheet.create({
    cell: {
        alignItems: 'center',
        borderRadius: RADIUS,
        height: CALENDAR_DAY_SIZE,
        justifyContent: 'center',
        width: CALENDAR_DAY_SIZE,
    },
    cellDisabled: {
        opacity: 0.45,
    },
    cellPressed: {
        backgroundColor: theme.calendar.month.pressedBackground,
    },
    cellToday: {
        backgroundColor: theme.calendar.month.todayBackground,
    },
    text: {
        fontFamily: 'System',
        fontSize: 17,
        fontWeight: theme.calendar.month.dayFontWeight,
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
