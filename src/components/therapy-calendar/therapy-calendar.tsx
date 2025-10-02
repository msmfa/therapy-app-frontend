import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScheduleModal from './schedule-modal';
import { GradientRow } from '../ui/GradientRow';

export const COLORS = {
    activeSessionBackground: 'rgba(211, 85, 85, 1)',
    activeSessionBorder: 'rgba(250, 169, 169, 1)',
    activeSessionText: 'rgba(255, 255, 255, 1)',
    calendarDayDefault: 'rgba(84, 38, 38, 1)',
    calendarDayDisabled: 'rgba(202, 164, 164, 1)',
    calendarMonthText: 'rgba(77, 49, 49, 1)',
    calendarSelectedBackground: 'rgba(76, 110, 245, 1)',
    calendarWeekdayHeader: 'rgba(162, 135, 135, 1)',
    maroon: 'rgba(117, 42, 42, 1)',
    scheduledBackground: 'rgba(247, 162, 164, 1)',
    scheduledBorder: 'rgba(250, 169, 169, 1)',
    scheduledText: 'rgba(226, 61, 61, 1)',
    todayBackground: 'rgba(0, 0, 0, 1)',
    todayText: 'rgba(255, 255, 255, 1)',
    unscheduledBackground: 'rgba(253, 166, 166, 1)',
};

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    children?: React.ReactNode;
    onSelectedSessionsChange: (sessions: SelectedSessions) => void;
    selectedSessions: SelectedSessions;
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
}: TherapyCalendarProps) {
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const markedDates = useMemo(() => {
        const circleBaseStyle = {
            alignItems: 'center',
            borderRadius: 18,
            height: 36,
            justifyContent: 'center',
            marginTop: -2,
            paddingTop: 5,
            width: 36,
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
                        marginTop: -2,
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
                        borderColor: COLORS.scheduledText,
                        borderWidth: 1,
                    },
                    text: {
                        color: COLORS.maroon,
                        fontWeight: '600',
                        marginTop: 0,
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
                        borderWidth: 0,
                    },
                    text: {
                        color: COLORS.todayText,
                        fontWeight: '600',
                        marginTop: 0,
                    },
                },
            };
        }

        return entries;
    }, [selectedSessions, activeDateKey]);

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
        arrowColor: COLORS.maroon,
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        dayTextColor: COLORS.calendarDayDefault,
        monthTextColor: COLORS.calendarMonthText,
        selectedDayBackgroundColor: COLORS.calendarSelectedBackground,
        selectedDayTextColor: COLORS.activeSessionBorder,
        textDayFontFamily: 'System',
        textDayFontSize: 15,
        textDayHeaderFontFamily: 'System',
        textDayHeaderFontSize: 15,
        textDisabledColor: COLORS.calendarDayDisabled,
        textMonthFontFamily: 'System',
        textMonthFontSize: 20,
        textSectionTitleColor: COLORS.calendarWeekdayHeader,
        todayTextColor: COLORS.scheduledText,
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
    calendarWrapper: {
        marginBottom: 18,
    },
    content: {
        flex: 1,
        paddingHorizontal: 4,
        paddingTop: 20,
        position: 'relative',
    },
});
