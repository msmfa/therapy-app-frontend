import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScheduleModal from './ScheduleModal';
import { GradientCard } from '../ui/GradientCard';
import { CALENDAR_COLORS, CALENDAR_DARK_COLORS, COLOR_VARIANTS } from 'designs/designs-colors';
import { DarkCalendarDay, DarkDayKind } from './DarkCalendarDay';

export const COLORS = {
    todayBackground: CALENDAR_COLORS.todayBackground,
    todayText: CALENDAR_COLORS.todayText,
    calendarSelectedBackground: CALENDAR_COLORS.calendarSelectedBackground,
    activeSessionBackground: CALENDAR_COLORS.activeSessionBackground,
    activeSessionText: CALENDAR_COLORS.activeSessionText,
    activeSessionBorder: CALENDAR_COLORS.activeSessionBorder,
    scheduledBackground: CALENDAR_COLORS.scheduledBackground,
    scheduledText: CALENDAR_COLORS.scheduledText,
    pressedText: CALENDAR_COLORS.pressedText,
    unscheduledBackground: CALENDAR_COLORS.unscheduledBackground,
    calendarDayDefault: CALENDAR_COLORS.calendarDayDefault,
    calendarDayDisabled: CALENDAR_COLORS.calendarDayDisabled,
    calendarMonthText: CALENDAR_COLORS.calendarMonthText,
    calendarWeekdayHeader: CALENDAR_COLORS.calendarWeekdayHeader,
    arrows: CALENDAR_COLORS.arrows,
    reminderBackground: CALENDAR_COLORS.reminderBackground,
    reminderBorder: CALENDAR_COLORS.reminderBorder,
    reminderText: CALENDAR_COLORS.reminderText,
    dotIndicator: CALENDAR_COLORS.dotIndicator,
};

export type TherapyCalendarVariant = 'light' | 'dark';

// The shape react-native-calendars reads back off `markedDates` when
// markingType is "custom".
type DayMarking = {
    marked?: boolean;
    dotColor?: string;
    /** Dark variant only: which of the two discs this day wears. */
    kind?: DarkDayKind;
    /** Dark variant only: the day whose schedule sheet is open. */
    pressed?: boolean;
    customStyles?: {
        container?: ViewStyle;
        text?: TextStyle;
    };
};

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    selectedSessions: SelectedSessions;
    children?: React.ReactNode;
    dotDates?: Array<string | Date>;
    fillAvailableSpace?: boolean;
    hideExtraDays?: boolean;
    /** `dark` drops the card and puts the month straight onto the backdrop. */
    variant?: TherapyCalendarVariant;
    onSelectedSessionsChange: (sessions: SelectedSessions) => void;
}

const WEEKLY_REPEAT_COUNT = 8;
const DEFAULT_TIME = new Date(2024, 0, 1, 9, 0, 0);

const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const createDateFromKey = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const LIGHT_THEME = {
    arrowColor: COLORS.arrows,
    backgroundColor: COLOR_VARIANTS.transparent,
    calendarBackground: COLOR_VARIANTS.transparent,
    dayTextColor: COLORS.calendarDayDefault,
    monthTextColor: COLORS.calendarMonthText,
    selectedDayBackgroundColor: COLORS.calendarSelectedBackground,
    selectedDayTextColor: COLORS.activeSessionBorder,
    textDisabledColor: COLORS.calendarDayDisabled,
    textSectionTitleColor: COLORS.calendarWeekdayHeader,
    todayTextColor: COLORS.scheduledText,
    textDayFontFamily: 'System',
    textDayFontSize: 16,
    textDayHeaderFontFamily: 'System',
    textDayHeaderFontSize: 14,
    textMonthFontFamily: 'System',
    textMonthFontSize: 20,
};

const DARK_THEME = {
    arrowColor: CALENDAR_DARK_COLORS.arrows,
    backgroundColor: COLOR_VARIANTS.transparent,
    calendarBackground: COLOR_VARIANTS.transparent,
    dayTextColor: CALENDAR_DARK_COLORS.dayDefault,
    monthTextColor: CALENDAR_DARK_COLORS.monthText,
    selectedDayBackgroundColor: COLOR_VARIANTS.transparent,
    selectedDayTextColor: CALENDAR_DARK_COLORS.dayDefault,
    textDisabledColor: CALENDAR_DARK_COLORS.dayDisabled,
    textSectionTitleColor: CALENDAR_DARK_COLORS.weekdayHeader,
    todayTextColor: CALENDAR_DARK_COLORS.todayText,
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
            color: CALENDAR_DARK_COLORS.weekdayHeader,
        },
    },
};

export default function TherapyCalendar({
    onSelectedSessionsChange,
    selectedSessions,
    dotDates = [],
    children,
    fillAvailableSpace = true,
    hideExtraDays = true,
    variant = 'light',
}: TherapyCalendarProps) {
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const isDark = variant === 'dark';

    const dotDateKeys = useMemo(() => {
        if (!dotDates?.length) {
            return [] as string[];
        }

        const keys = new Set<string>();
        dotDates.forEach((value) => {
            if (value instanceof Date) {
                if (!Number.isNaN(value.getTime())) {
                    keys.add(formatDateKey(value));
                }
                return;
            }

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return;

                const parsed = new Date(trimmed);
                if (!Number.isNaN(parsed.getTime())) {
                    keys.add(formatDateKey(parsed));
                    return;
                }

                // Allow direct date-key strings (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    keys.add(trimmed);
                }
            }
        });

        return Array.from(keys);
    }, [dotDates]);

    // The dark variant renders its own day cell, so the marking map only has to
    // say which disc each day wears; DarkCalendarDay owns the drawing.
    const buildDarkMarkings = useCallback(() => {
        const entries: Record<string, DayMarking> = {};

        // Reminders first, so a day that is both falls through to the session
        // disc below.
        dotDateKeys.forEach((dateKey) => {
            entries[dateKey] = { kind: 'reminder' };
        });

        Object.keys(selectedSessions).forEach((dateKey) => {
            entries[dateKey] = { kind: 'session' };
        });

        if (activeDateKey) {
            entries[activeDateKey] = { ...(entries[activeDateKey] ?? {}), pressed: true };
        }

        return entries;
    }, [selectedSessions, activeDateKey, dotDateKeys]);

    const buildLightMarkings = useCallback(() => {
        // ODO:: change dots to text color on the day so key will be text is red and circle will be therapy day
        const circleBaseStyle: ViewStyle = {
            alignItems: 'center',
            borderRadius: 20,
            justifyContent: 'center',
        };

        // Lifts session days off the card. Only they carry it, so a glance at
        // the month picks out the therapy dates before you read any numbers.
        const sessionShadow: ViewStyle = {
            shadowColor: COLORS.activeSessionBorder,
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.68,
            shadowRadius: 9,
            elevation: 10,
        };

        const sessionBorder: ViewStyle = {
            borderColor: COLORS.activeSessionBorder,
            borderWidth: 1,
        };

        const entries = Object.keys(selectedSessions).reduce<Record<string, DayMarking>>((acc, dateKey) => {
            const isActive = activeDateKey === dateKey;
            acc[dateKey] = {
                customStyles: {
                    container: {
                        ...circleBaseStyle,
                        ...sessionShadow,
                        ...sessionBorder,
                        backgroundColor: isActive ? COLORS.activeSessionBackground : COLORS.scheduledBackground,
                    },
                    text: {
                        color: isActive ? COLORS.activeSessionText : COLORS.scheduledText,
                        fontWeight: '600',
                    },
                },
            };
            return acc;
        }, {});

        if (activeDateKey && !entries[activeDateKey]) {
            entries[activeDateKey] = {
                customStyles: {
                    container: {
                        ...circleBaseStyle,
                        ...sessionBorder,
                        backgroundColor: COLORS.unscheduledBackground,
                    },
                    text: {
                        color: COLORS.pressedText,
                        fontWeight: '600',
                    },
                },
            };
        }

        const todayKey = formatDateKey(new Date());
        if (!entries[todayKey]) {
            entries[todayKey] = {
                customStyles: {
                    container: {
                        ...circleBaseStyle,
                        backgroundColor: COLORS.todayBackground,
                        borderWidth: 1,
                    },
                    text: {
                        color: COLORS.todayText,
                        fontWeight: '600',
                    },
                },
            };
        }

        dotDateKeys.forEach((dateKey) => {
            const entryWithoutDots = { ...(entries[dateKey] ?? {}) };
            const isTherapySession = Object.prototype.hasOwnProperty.call(selectedSessions, dateKey);
            delete entryWithoutDots.marked;
            delete entryWithoutDots.dotColor;

            const {
                text: existingTextStyles = {},
                ...otherCustomStyles
            } = entryWithoutDots.customStyles ?? {};

            entries[dateKey] = {
                ...entryWithoutDots,
                customStyles: {
                    ...otherCustomStyles,
                    text: {
                        ...existingTextStyles,
                        color: isTherapySession ? COLORS.scheduledText : COLORS.dotIndicator,
                        fontWeight: '600',
                    },
                },
            };
        });

        return entries;
    }, [selectedSessions, activeDateKey, dotDateKeys]);

    const markedDates = useMemo(
        () => (isDark ? buildDarkMarkings() : buildLightMarkings()),
        [isDark, buildDarkMarkings, buildLightMarkings],
    );

    const openModalForDate = useCallback((dateKey: string) => {
        setActiveDateKey(dateKey);
        setIsModalVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalVisible(false);
        setActiveDateKey(null);
    }, []);

    const handleDayPress = useCallback(
        (day: { dateString: string }) => {
            openModalForDate(day.dateString);
        },
        [openModalForDate],
    );

    const applySession = useCallback(
        (mode: ScheduleMode, time: Date) => {
            if (!activeDateKey) return;

            const next: SelectedSessions = { ...selectedSessions };

            const applyTimeToDate = (dateKey: string, baseDate: Date) => {
                const sessionDate = new Date(baseDate);
                sessionDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
                next[dateKey] = sessionDate;
            };

            if (mode === 'single') {
                const baseDate = createDateFromKey(activeDateKey);
                applyTimeToDate(activeDateKey, baseDate);
            } else if (mode === 'weekly_pattern') {
                const startDate = createDateFromKey(activeDateKey);
                for (let index = 0; index < WEEKLY_REPEAT_COUNT; index += 1) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + index * 7);
                    const dateKey = formatDateKey(date);
                    applyTimeToDate(dateKey, date);
                }
            }

            onSelectedSessionsChange(next);
            closeModal();
        },
        [activeDateKey, closeModal, onSelectedSessionsChange, selectedSessions],
    );

    const handleDelete = useCallback(() => {
        if (!activeDateKey) return;
        const next = { ...selectedSessions };
        delete next[activeDateKey];
        onSelectedSessionsChange(next);
        closeModal();
    }, [activeDateKey, closeModal, onSelectedSessionsChange, selectedSessions]);

    const calendarTheme = isDark ? DARK_THEME : LIGHT_THEME;

    const calendar = (
        <Calendar
            dayComponent={ isDark ? DarkCalendarDay : undefined }
            hideExtraDays={ hideExtraDays }
            markedDates={ markedDates }
            markingType="custom"
            minDate={ formatDateKey(new Date()) }
            onDayPress={ handleDayPress }
            theme={ calendarTheme as never }
            style={ isDark ? styles.calendarDark : styles.calendar }
            testID="therapy-calendar"
        />
    );

    return (
        <>
            <View style={ [styles.content, fillAvailableSpace && styles.contentFill] }>
                { isDark ? calendar : (
                    <GradientCard addedStyles={ styles.calendarWrapper }>
                        { calendar }
                    </GradientCard>
                ) }
                { children }
            </View>
            { isModalVisible && activeDateKey && (
                <ScheduleModal
                    defaultTime={ DEFAULT_TIME }
                    existingSession={
                        selectedSessions[activeDateKey]
                            ? {
                                date: activeDateKey,
                                id: activeDateKey,
                                time: selectedSessions[activeDateKey],
                            }
                            : null
                    }
                    onCancel={ closeModal }
                    onConfirm={ applySession }
                    onDelete={ handleDelete }
                    selectedDate={ activeDateKey }
                    visible={ isModalVisible }
                />
            ) }
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 4,
        position: 'relative',
    },
    contentFill: {
        flex: 1,
    },
    calendarWrapper: {
        paddingHorizontal: 4,
    },
    calendar: {
        paddingVertical: 14,
    },
    calendarDark: {
        paddingHorizontal: 10,
        paddingTop: 4,
        paddingBottom: 22,
    },
});
