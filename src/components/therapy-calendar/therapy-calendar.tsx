import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import ScheduleModal from './schedule-modal';
import { Button } from '../ui/button';
import { InfoBlock } from '../infoBlock';

export const COLORS = {
    activeSessionBackground: 'rgba(211, 85, 85, 1)',
    activeSessionBorder: 'rgba(250, 169, 169, 1)',
    activeSessionText: 'rgba(255, 255, 255, 1)',
    calendarDayDefault: 'rgba(142, 105, 105, 1)',
    calendarDayDisabled: 'rgba(202, 164, 164, 1)',
    calendarMonthText: 'rgba(77, 49, 49, 1)',
    calendarSelectedBackground: 'rgba(76, 110, 245, 1)',
    calendarWeekdayHeader: 'rgba(162, 135, 135, 1)',
    glassBackground: 'rgba(255, 255, 255, 0.29)',
    glassBorder: 'rgba(255, 255, 255, 0.21)',
    instructionBackground: 'rgba(241, 241, 254, 0.32)',
    instructionBorder: 'rgba(75, 69, 169, 0.35)',
    instructionText: 'rgba(75, 69, 169, 1)',
    legendLabel: 'rgba(53, 31, 31, 1)',
    maroon: 'rgba(117, 42, 42, 1)',
    scheduledBackground: 'rgba(251, 186, 188, 1)',
    scheduledBorder: 'rgba(250, 169, 169, 1)',
    scheduledText: 'rgba(226, 61, 61, 1)',
    todayBackground: 'rgba(0, 0, 0, 1)',
    todayText: 'rgba(255, 255, 255, 1)',
    unscheduledBackground: 'rgba(239, 208, 208, 1)',
    wrapperShadow: 'rgba(0, 0, 0, 0.15)',
    white: 'rgba(255, 255, 255, 1)',
};

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    buttonAtBottom?: boolean;
    initialSessions: SelectedSessions;
    onSave: (sessions: SelectedSessions) => void;
}

const WEEKLY_REPEAT_COUNT = 8;
const DEFAULT_TIME = new Date(2024, 0, 1, 9, 0, 0);

const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const createDateFromKey = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export default function TherapyCalendar({ buttonAtBottom, onSave, initialSessions }: TherapyCalendarProps) {
    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>({});
    const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        if (initialSessions) {
            setSelectedSessions(initialSessions);
        }
    }, [initialSessions]);

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
                        borderWidth: isActive ? 0 : 1,
                    },
                    text: {
                        color: isActive ? COLORS.activeSessionText : COLORS.scheduledText,
                        fontWeight: '600',
                        marginTop: 0,
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

            setSelectedSessions((prev) => {
                const next: SelectedSessions = { ...prev };

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

                return next;
            });

            closeModal();
        },
        [activeDateKey, closeModal],
    );

    const handleDelete = useCallback(() => {
        if (!activeDateKey) return;
        setSelectedSessions((prev) => {
            const next = { ...prev };
            delete next[activeDateKey];
            return next;
        });
        closeModal();
    }, [activeDateKey, closeModal]);

    const handleSave = useCallback(() => {
        const count = Object.keys(selectedSessions).length;
        if (count === 0) {
            Alert.alert('No Sessions', 'Please add at least one session');
            return;
        }
        onSave(selectedSessions);
    }, [onSave, selectedSessions]);

    const sessionCount = Object.keys(selectedSessions).length;

    const calendarTheme = {
        arrowColor: COLORS.maroon, // Month navigation arrows
        backgroundColor: 'transparent', // Calendar root background
        calendarBackground: 'transparent', // Calendar month panel background
        dayTextColor: COLORS.calendarDayDefault, // Default day numbers
        monthTextColor: COLORS.calendarMonthText, // Month title text
        selectedDayBackgroundColor: COLORS.calendarSelectedBackground, // Selected day circle fill
        selectedDayTextColor: COLORS.white, // Selected day number color
        textDayFontFamily: 'System', // Day numbers font family
        textDayFontSize: 15, // Day numbers font size
        textDayHeaderFontFamily: 'System', // Weekday headers font family
        textDayHeaderFontSize: 15, // Weekday headers font size
        textDisabledColor: COLORS.calendarDayDisabled, // Disabled day numbers
        textMonthFontFamily: 'System', // Month title font family
        textMonthFontSize: 20, // Month title font size
        textSectionTitleColor: COLORS.calendarWeekdayHeader, // Weekday header text color
        todayTextColor: COLORS.scheduledText, // Today's date number color
    };

    return (
        <>
            <View style={ styles.content }>
                <Calendar
                    hideExtraDays
                    markedDates={ markedDates }
                    markingType="custom"
                    minDate={ formatDateKey(new Date()) }
                    onDayPress={ handleDayPress }
                    theme={ calendarTheme }
                />
                <View style={ styles.keyAndButtons }>
                    <View style={ styles.legendWrapper }>
                        <View style={ styles.legendCard }>
                            <View>
                                <View style={ styles.legendItem }>
                                    <View style={ styles.legendCircleTherapy } />
                                    <Text style={ styles.legendLabel }>Therapy session</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <InfoBlock text={'Press on a date on the calendar to update your therapy session. Then press the update button below to save them.'} />
                    <View style={ styles.buttons }>
                        <Button
                            disabled={ sessionCount === 0 }
                            label="Clear All"
                            onPress={ () => setSelectedSessions({}) }
                        />
                        { buttonAtBottom ? (
                            <View style={ styles.buttonAtBottom }>
                                <Button
                                    disabled={ sessionCount === 0 }
                                    label="Update"
                                    onPress={ handleSave }
                                />
                            </View>
                        ) : (
                            <Button
                                disabled={ sessionCount === 0 }
                                label={ `Save (${sessionCount})` }
                                onPress={ handleSave }
                            />
                        ) }
                    </View>
                </View>
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
    buttonAtBottom: {
        gap: 0,
    },
    buttons: {
        alignSelf: 'stretch',
        gap: 12,
    },
    content: {
        flex: 1,
        paddingTop: 20,
        position: 'relative',
    },
    keyAndButtons: {
        bottom: 20,
        gap: 12,
        paddingHorizontal: 18,
        left: 0,
        position: 'absolute',
        right: 0,
    },
    legendCard: {
        backgroundColor: COLORS.glassBackground,
        borderColor: COLORS.glassBorder,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    legendCardInstruction: {
        backgroundColor: COLORS.instructionBackground,
        borderColor: COLORS.instructionBorder,
    },
    legendCircleTherapy: {
        backgroundColor: COLORS.unscheduledBackground,
        borderColor: COLORS.scheduledText,
        borderRadius: 10,
        borderWidth: 1,
        height: 20,
        width: 20,
    },
    legendCircleToday: {
        backgroundColor: COLORS.todayBackground,
        borderRadius: 10,
        height: 20,
        width: 20,
    },
    legendInstruction: {
        color: COLORS.instructionText,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    legendItem: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    legendLabel: {
        color: COLORS.legendLabel,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    legendWrapper: {
        borderRadius: 16,
        elevation: 12,
        shadowColor: COLORS.wrapperShadow,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
    },
    root: {
        backgroundColor: 'transparent',
        flex: 1,
    },
});
