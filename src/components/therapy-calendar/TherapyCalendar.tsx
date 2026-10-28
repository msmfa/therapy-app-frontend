import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../ui/AppText';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import type { Theme } from 'designs/designs-themes';
import { useTheme } from '../../context/theme';
import { CalendarDay } from './CalendarDay';
import { getSessionsWindow } from '../../utils/sessionWindow';
import { getCalendarFetchWindow } from '../../features/calendar/calendarSelectors';
import { applyCalendarLocale } from './calendarLocale';
import { formattingLocale } from '../../i18n';
import type { CalendarReminder, TherapySession } from '../../api/therapy';

/**
 * The month grid, and nothing else.
 *
 * It draws what it is given (sessions as discs, reminders as dots, the past
 * faded) and reports which day was pressed. What opens for that day, and what
 * an edit does, is the screen's business: the grid used to own the schedule
 * sheet and a draft of the edits, which is what made saving a separate step.
 */

// The shape react-native-calendars reads back off `markedDates` when a custom
// day component is in use. CalendarDay owns the drawing; this only says which
// marks each day wears.
type DayMarking = {
    /** Never set; carried so the map stays assignable to the library's MarkingProps. */
    marked?: boolean;
    kind?: 'session' | 'reminder';
    reminder?: boolean;
    muted?: boolean;
    pressed?: boolean;
};

/**
 * A request to bring one day into view, as YYYY-MM-DD.
 *
 * `seq` is what makes the same day askable twice. The grid jumps by
 * remounting on this, and a remount only happens when something in the key
 * changes: without the counter, asking for October, paging away by hand and
 * asking for October again would do nothing at all.
 */
export type CalendarFocus = { dateKey: string; seq: number };

export type TherapyCalendarProps = {
    sessions: TherapySession[];
    reminders: CalendarReminder[];
    /** The day whose sheet is open, as YYYY-MM-DD, so the cell can show it. */
    activeDateKey?: string | null;
    /** The month to jump to, when something off-screen is being pointed at. */
    focus?: CalendarFocus | null;
    onDayPress: (dateKey: string) => void;
    /** Shows a gear to the right of the next-month arrow that opens the schedule settings. */
    onOpenSettings?: () => void;
    hideExtraDays?: boolean;
};

export const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * "YYYY-MM-DD" read back as local midnight. Built with the Date constructor
 * directly it parses as UTC midnight, which lands on the wrong day near either
 * end of a negative or positive zone.
 */
export const createDateFromKey = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// The library's own header geometry (calendar/header/style.js), which the gear
// has to line up with from outside it.
const HEADER_MARGIN_TOP = 6;
const HEADER_PADDING = 10;
const MONTH_MARGIN = 10;
// The gear's 44pt touch target, and the room kept for it right of the arrow.
const SETTINGS_SIZE = 44;
const SETTINGS_SLOT = SETTINGS_SIZE + 4;
// The calendar container's own inset: the library's paddingRight of 5 wins
// over the paddingHorizontal set in styles.calendar.
const CONTAINER_INSET = 5;

const makeTheme = (theme: Theme, withSettings: boolean) => ({
    arrowColor: theme.calendar.month.arrows,
    backgroundColor: COLOR_VARIANTS.transparent,
    calendarBackground: COLOR_VARIANTS.transparent,
    dayTextColor: theme.calendar.month.dayDefault,
    monthTextColor: theme.calendar.month.monthText,
    selectedDayBackgroundColor: COLOR_VARIANTS.transparent,
    selectedDayTextColor: theme.calendar.month.dayDefault,
    textDisabledColor: theme.calendar.month.dayDisabled,
    textSectionTitleColor: theme.calendar.month.weekdayHeader,
    todayTextColor: theme.calendar.month.todayText,
    textDayFontFamily: 'System',
    textDayFontSize: 17,
    textDayFontWeight: '400',
    textDayHeaderFontFamily: 'System',
    textDayHeaderFontSize: 15,
    textDayHeaderFontWeight: '400',
    textMonthFontFamily: 'System',
    textMonthFontSize: 26,
    textMonthFontWeight: '400',
    weekVerticalMargin: 8,
    // Weekday labels default to a fixed 32pt width while the day cells below
    // them are flex, which leaves the two grids a couple of points out of step.
    // Flexing the labels lines the columns up exactly.
    'stylesheet.calendar.header': {
        // Replaces the library's header style whole, so it repeats it, with
        // the right padding widened to leave the gear its own slot.
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: HEADER_MARGIN_TOP,
            paddingLeft: HEADER_PADDING,
            paddingRight: HEADER_PADDING + (withSettings ? SETTINGS_SLOT : 0),
        },
        week: {
            marginTop: 16,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        dayHeader: {
            flex: 1,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: '400',
            color: theme.calendar.month.weekdayHeader,
        },
    },
});

export default function TherapyCalendar({
    sessions,
    reminders,
    activeDateKey = null,
    focus = null,
    onDayPress,
    onOpenSettings,
    hideExtraDays = false,
}: TherapyCalendarProps) {
    // Before the calendar renders, so its header is in the app's language
    // rather than the library's built-in English.
    applyCalendarLocale(formattingLocale());
    const { theme } = useTheme();
    const withSettings = onOpenSettings !== undefined;
    const calendarTheme = useMemo(() => makeTheme(theme, withSettings), [theme, withSettings]);
    const { t } = useTranslation('calendar');
    // The month row's height, measured off the title so the gear stays centred
    // on it when Dynamic Type makes the title taller.
    const [headerRowHeight, setHeaderRowHeight] = useState(32 + MONTH_MARGIN * 2);
    const measureMonth = (event: LayoutChangeEvent) =>
        setHeaderRowHeight(event.nativeEvent.layout.height + MONTH_MARGIN * 2);

    const markedDates = useMemo(() => {
        const entries: Record<string, DayMarking> = {};
        const todayKey = formatDateKey(new Date());
        const mark = (key: string, patch: DayMarking) => {
            entries[key] = { ...(entries[key] ?? {}), ...patch };
        };

        for (const reminder of reminders) {
            // The reminder's own local day: 20:00 in Los Angeles is 04:00 UTC
            // the next morning, and deriving the day from the instant put the
            // dots a day out for anyone whose evening crosses UTC midnight.
            mark(reminder.localDate, { reminder: true });
        }
        for (const session of sessions) {
            const date = new Date(session.startsAtUtc);
            if (Number.isNaN(date.getTime())) continue;
            mark(formatDateKey(date), { kind: 'session' });
        }
        for (const key of Object.keys(entries)) {
            if (entries[key].reminder && entries[key].kind !== 'session') entries[key].kind = 'reminder';
            if (key < todayKey) entries[key].muted = true;
        }
        if (activeDateKey) mark(activeDateKey, { pressed: true });

        return entries;
    }, [sessions, reminders, activeDateKey]);

    // The whole fetched range is navigable: the past so a fired reminder and
    // the session it followed can be looked at, the future as far as an
    // appointment can be booked.
    const { from } = getCalendarFetchWindow();
    const { to } = getSessionsWindow();

    const calendar = (
        <Calendar
            // The library builds the header's and arrows' styles once, when
            // it mounts, and never reads `theme` again: switching appearance
            // left the month title, the arrows and the weekday labels in the
            // old scheme's ink. Remounting on a scheme change is the only way
            // to make it look at the new theme, and it is also how the grid
            // lands on `focus`, which `initialDate` only reads at mount.
            key={ `${theme.scheme}:${focus?.seq ?? 0}` }
            dayComponent={ CalendarDay }
            hideExtraDays={ hideExtraDays }
            initialDate={ focus?.dateKey }
            markedDates={ markedDates }
            markingType="custom"
            minDate={ formatDateKey(from) }
            maxDate={ formatDateKey(to) }
            disableAllTouchEventsForDisabledDays
            onDayPress={ (day) => onDayPress(day.dateString) }
            // The library's title, set the same way, only so its height can be
            // read for the gear.
            renderHeader={ withSettings ? (date) => (
                <AppText
                    variant="body"
                    style={ [styles.month, { color: theme.calendar.month.monthText }] }
                    onLayout={ measureMonth }
                >
                    { date?.toString('MMMM yyyy') }
                </AppText>
            ) : undefined }
            theme={ calendarTheme as never }
            style={ styles.calendar }
            testID="therapy-calendar"
        />
    );

    if (!withSettings) return calendar;

    // Outside the header on purpose: the library makes its header a single
    // accessible element, so a button inside it is unreachable with VoiceOver.
    return (
        <View>
            { calendar }
            <TouchableOpacity
                onPress={ onOpenSettings }
                accessibilityRole="button"
                accessibilityLabel={ t('schedule.openSettings') }
                style={ [
                    styles.settings,
                    { top: styles.calendar.paddingTop + HEADER_MARGIN_TOP + (headerRowHeight - SETTINGS_SIZE) / 2 },
                ] }
                testID="therapy-calendar.settings"
            >
                <Ionicons name="settings-outline" size={ 22 } color={ theme.calendar.month.arrows } />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    month: {
        fontSize: 26,
        fontWeight: '400',
        lineHeight: 32,
        margin: MONTH_MARGIN,
    },
    settings: {
        position: 'absolute',
        right: CONTAINER_INSET + HEADER_PADDING - (SETTINGS_SLOT - SETTINGS_SIZE),
        width: SETTINGS_SIZE,
        height: SETTINGS_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendar: {
        paddingHorizontal: 14,
        paddingTop: 4,
        paddingBottom: 22,
    },
});
