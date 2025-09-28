import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { InfoBlock } from '../infoBlock';
import { Button } from '../button';
import ScheduleModal from './schedule-modal';

type SelectedSessions = Record<string, Date>;
type ScheduleMode = 'single' | 'weekly_pattern';

interface TherapyCalendarProps {
    initialSessions: SelectedSessions;
    buttonAtBottom?: boolean;
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
        return Object.keys(selectedSessions).reduce<Record<string, { marked: true; selected: boolean }>>(
            (acc, dateKey) => {
                acc[dateKey] = { marked: true, selected: activeDateKey === dateKey };
                return acc;
            },
            activeDateKey && !selectedSessions[activeDateKey]
                ? { [activeDateKey]: { marked: true, selected: true } }
                : {},
        );
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

    return (
        <>
            <View style={styles.container}>
                <Calendar
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    markingType="dot"
                    hideExtraDays
                    minDate={formatDateKey(new Date())}
                />

                <InfoBlock
                    text={`${sessionCount} sessions selected. Tap dates to add sessions, then save.`}
                    icon="💡"
                />

                <View style={styles.buttons}>
                    <Button label="Clear All" onPress={() => setSelectedSessions({})} disabled={sessionCount === 0} />

                    {!buttonAtBottom && (
                        <Button label={`Save (${sessionCount})`} onPress={handleSave} disabled={sessionCount === 0} />
                    )}
                </View>

                {buttonAtBottom && (
                    <View style={styles.buttonAtBottom}>
                        <Button label="Add Sessions" onPress={handleSave} disabled={sessionCount === 0} />
                    </View>
                )}
            </View>

            {isModalVisible && activeDateKey && (
                <ScheduleModal
                    visible={isModalVisible}
                    selectedDate={activeDateKey}
                    existingSession={
                        selectedSessions[activeDateKey]
                            ? {
                                    id: activeDateKey,
                                    date: activeDateKey,
                                    time: selectedSessions[activeDateKey],
                                }
                            : null
                    }
                    defaultTime={DEFAULT_TIME}
                    onConfirm={applySession}
                    onDelete={handleDelete}
                    onCancel={closeModal}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        position: 'relative',
    },
    buttons: {
        // flexDirection: 'row',
        // padding: 10,
        // gap: 10,
    },
    buttonAtBottom: {
        paddingTop: 10,
    },
});
