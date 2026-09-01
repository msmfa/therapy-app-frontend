import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { CALENDAR_DARK_COLORS } from 'designs/designs-colors';

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

// Marks sit under the numeral rather than behind it, so the month reads as a
// plain grid of dates and the kind is carried by the colour of the dots.
//
// Rendered on every day, transparent where there is nothing to show, and
// positioned absolutely so it takes no space in the cell's column. In flow it
// weighed the same as the library's hidden dot did: the cell centres its
// contents, so anything below the numeral lifts the numeral off centre by half
// that thing's height, and the number sat high inside the today disc.
function DayDots({ color }: { color: string }) {
    return (
        <View pointerEvents="none" style={ styles.dotRow }>
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
    const isDisabled = state === 'disabled';
    const kind = marking?.kind;
    const isPressed = Boolean(marking?.pressed);
    const isToday = state === 'today';
    const isTodayCell = !isPressed && !kind && isToday;

    const dotColor = kind === 'session'
        ? CALENDAR_DARK_COLORS.sessionDot
        : kind === 'reminder'
            ? CALENDAR_DARK_COLORS.reminderDot
            : undefined;

    const cellStyle = [
        styles.cell,
        // A marked day outside the month, or before the first bookable date,
        // keeps its dots and fades as a whole rather than losing them.
        isDisabled && Boolean(kind) && styles.cellDisabled,
        isPressed && styles.cellPressed,
        isTodayCell && styles.cellToday,
    ];

    const color = isTodayCell
        ? CALENDAR_DARK_COLORS.todayText
        : isDisabled && !kind
            ? CALENDAR_DARK_COLORS.dayDisabled
            : CALENDAR_DARK_COLORS.dayDefault;

    return (
        <TouchableOpacity
            accessibilityLabel={ accessibilityLabel }
            accessibilityRole={ isDisabled ? undefined : 'button' }
            activeOpacity={ 0.7 }
            disabled={ isDisabled }
            onPress={ isDisabled ? undefined : () => onPress?.(date) }
            style={ cellStyle }
            testID={ testID }
        >
            <Text allowFontScaling={ false } style={ [styles.text, { color }] }>
                { children }
            </Text>
            <DayDots color={ dotColor ?? 'transparent' } />
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
    dot: {
        borderRadius: 2,
        height: 4,
        width: 4,
    },
});
