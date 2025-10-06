import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScheduleModal from './ScheduleModal';
import { GradientCard } from '../ui/GradientCard';
import { palette } from '../../../new-design';

export const COLORS = {
    todayBackground: palette.calendar.calendarTodayBackground,
    todayText: palette.calendar.calendarTodayText,
    calendarSelectedBackground: palette.calendar.calendarTodayBackground,
    activeSessionBackground: palette.calendar.calendarSessionBackground,
    activeSessionText: palette.calendar.calendarSessionText,
    activeSessionBorder: palette.calendar.calendarSessionBorder,
    scheduledBackground: palette.calendar.calendarSessionBackground,
    scheduledText: palette.calendar.calendarSessionText,
    pressedText: palette.calendar.calendarSessionText,
    unscheduledBackground: palette.calendar.calendarSessionBackground,
    calendarDayDefault: palette.calendar.calendarDayText,
    calendarDayDisabled: palette.calendar.calendarDayDisabledText,
    calendarMonthText: palette.calendar.calendarMonthLabel,
    calendarWeekdayHeader: palette.calendar.calendarWeekdayLabel,
    arrows: palette.calendar.calendarArrow,
    dotIndicator: palette.calendar.calendarDot,
};

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    selectedSessions: SelectedSessions;
    children?: React.ReactNode;
    dotDates?: Array<string | Date>;
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

export default function TherapyCalendar({
    onSelectedSessionsChange,
    selectedSessions,
    dotDates = [],
    children,
}: TherapyCalendarProps) {
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

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

    const markedDates = useMemo(() => {
        // ODO:: change dots to text color on the day so key will be text is red and circle will be therapy day
        const circleBaseStyle = {
            alignItems: 'center',
            borderRadius: 20,
            // height: 40,
            justifyContent: 'center',
            // width: 40,
        };

        const entries = Object.keys(selectedSessions).reduce<Record<string, any>>((acc, dateKey) => {
            const isActive = activeDateKey === dateKey;
            acc[dateKey] = {
                customStyles: {
                    container: {
                        ...circleBaseStyle,
                        backgroundColor: isActive ? COLORS.activeSessionBackground : COLORS.scheduledBackground,
                        borderColor: COLORS.activeSessionBorder,
                        borderWidth: 1,
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
                        backgroundColor: COLORS.unscheduledBackground,
                        borderColor: COLORS.activeSessionBorder,
                        borderWidth: 1,
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

        if (dotDateKeys.length > 0) {
            dotDateKeys.forEach((dateKey) => {
                const entryWithoutDots = { ...(entries[dateKey] ?? {}) };
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
                            color: COLORS.scheduledText,
                            fontWeight: '600',
                        },
                    },
                };
            });
        }

        return entries;
    }, [selectedSessions, activeDateKey, dotDateKeys]);

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

    const calendarTheme = {
        arrowColor: COLORS.arrows,
        backgroundColor: palette.neutral.transparentTransparent,
        calendarBackground: palette.neutral.transparentTransparent,
        dayTextColor: COLORS.calendarDayDefault,
        monthTextColor: COLORS.calendarMonthText,
        selectedDayBackgroundColor: COLORS.calendarSelectedBackground,
        selectedDayTextColor: COLORS.activeSessionBorder,
         textDisabledColor: COLORS.calendarDayDisabled,
        textSectionTitleColor: COLORS.calendarWeekdayHeader,
        todayTextColor: COLORS.scheduledText,
        // fonts
        textDayFontFamily: 'System',
        textDayFontSize: 16,
        textDayHeaderFontFamily: 'System',
        textDayHeaderFontSize: 14,
        textMonthFontFamily: 'System',
        textMonthFontSize: 20,
        dotStyle: {
            // marginTop: 2,
        },
    };

    return (
        <>
            <View style={styles.content}>
                <GradientCard addedStyles={styles.calendarWrapper}>
                    <Calendar
                        hideExtraDays
                        markedDates={markedDates}
                        markingType="custom"
                        minDate={formatDateKey(new Date())}
                        onDayPress={handleDayPress}
                        theme={calendarTheme}
                        style={styles.calendar}
                    />
                </GradientCard>
                {children}
            </View>
            {isModalVisible && activeDateKey && (
                <ScheduleModal
                    defaultTime={DEFAULT_TIME}
                    existingSession={
                        selectedSessions[activeDateKey]
                            ? {
                                  date: activeDateKey,
                                  id: activeDateKey,
                                  time: selectedSessions[activeDateKey],
                              }
                            : null
                    }
                    onCancel={closeModal}
                    onConfirm={applySession}
                    onDelete={handleDelete}
                    selectedDate={activeDateKey}
                    visible={isModalVisible}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: 4,
        position: 'relative',
    },
    calendarWrapper: {
        paddingHorizontal: 4,
    },
    calendar: {
        paddingVertical: 14,
    },
});
