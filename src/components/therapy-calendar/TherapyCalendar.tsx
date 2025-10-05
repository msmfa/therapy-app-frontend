import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScheduleModal from './ScheduleModal';
import { GradientRow } from '../ui/GradientRow';

export const COLORS = {
    todayBackground: '#000000',
    todayText: '#FFFFFF',
    calendarSelectedBackground: '#000000',
    activeSessionBackground: 'hsl(0, 72%, 85%)',
    activeSessionText: 'hsl(0, 72%, 50%)',
    activeSessionBorder: 'hsl(0, 72%, 75%)',
    scheduledBackground: 'hsl(0, 72%, 85%)',
    scheduledText: 'hsl(0, 72%, 50%)',
    pressedText: 'hsl(0, 72%, 50%)',
    unscheduledBackground: 'hsl(0, 72%, 85%)',
    calendarDayDefault: 'hsl(0, 42%, 20%)',
    calendarDayDisabled: 'hsl(0, 22%, 80%)',
    calendarMonthText: 'hsl(0, 12%, 10%)',
    calendarWeekdayHeader: 'hsl(0, 10%, 45%)',
    arrows: 'hsl(0, 0%, 30%)',
    dotIndicator: 'hsl(0, 52%, 50%)',
};

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    children?: React.ReactNode;
    onSelectedSessionsChange: (sessions: SelectedSessions) => void;
    selectedSessions: SelectedSessions;
    dotDates?: Array<string | Date>;
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
    children,
    onSelectedSessionsChange,
    selectedSessions,
    dotDates = [],
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
        const circleBaseStyle = {
            alignItems: 'center',
            borderRadius: 20,
            height: 40,
            justifyContent: 'center',
            marginTop: -5,
            paddingTop: 0,
            width: 40,
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
                        marginTop: 5,
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
                        color:COLORS.pressedText,
                        fontWeight: '600',
                        marginTop: 5,
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
                        marginTop: 5,
                    },
                },
            };
        }

        if (dotDateKeys.length > 0) {
            dotDateKeys.forEach((dateKey) => {
                entries[dateKey] = {
                    ...entries[dateKey],
                    marked: true,
                    dotColor: COLORS.dotIndicator,
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
        backgroundColor: '#00000000',
        calendarBackground: '#00000000',
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
    };

    return (
        <>
            <View style={styles.content}>
                <GradientRow addedStyles={styles.calendarWrapper}>
                    <Calendar
                        hideExtraDays
                        markedDates={markedDates}
                        markingType="custom"
                        minDate={formatDateKey(new Date())}
                        onDayPress={handleDayPress}
                        theme={calendarTheme}
                        style={ styles.calendar }
                    />
                </GradientRow>
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
