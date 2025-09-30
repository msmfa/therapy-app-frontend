import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import RadioButton from '../ui/RadioButton';
import { Button } from '../ui/button';

interface Session {
    id: string;
    date: string;
    time: Date;
}

type ScheduleMode = 'single' | 'weekly_pattern';

interface ScheduleModalProps {
    visible: boolean;
    selectedDate: string | null;
    existingSession: Session | null;
    defaultTime: Date;
    onConfirm: (mode: ScheduleMode, time: Date) => void;
    onDelete: () => void;
    onCancel: () => void;
}

export default function ScheduleModal({
    visible,
    selectedDate,
    existingSession,
    defaultTime,
    onConfirm,
    onDelete,
    onCancel,
}: ScheduleModalProps) {
    const [time, setTime] = useState(defaultTime);
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekly_pattern');
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setTime(existingSession?.time || defaultTime);
            setScheduleMode('weekly_pattern');
        }
    }, [visible, existingSession, defaultTime]);

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
            if (event.type === 'dismissed') return;
        }

        if (selectedTime && !Number.isNaN(selectedTime.getTime())) {
            setTime(selectedTime);
        }
    };

    const handleConfirm = () => {
        onConfirm(scheduleMode, time);
    };

    const selectedDay = selectedDate ? dayjs(selectedDate) : null;
    const scheduleModeOptions: ScheduleMode[] = ['weekly_pattern', 'single'];
    const scheduleModeDictionary = {
        single: { title: 'This day only', subtext: 'Schedule just for selected date' },
        weekly_pattern: {
            title: 'Every week',
            subtext: selectedDay
                ? `Schedule every ${selectedDay.format('dddd')} for the next 2 months`
                : 'Schedule every week for the next 2 months',
        },
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
                <View style={styles.modalContent}>
                    {selectedDay && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{selectedDay.format('dddd Do')}</Text>
                        </View>
                    )}

                    <View style={styles.datePicker}>
                        {Platform.OS === 'ios' ? (
                            <DateTimePicker value={time} mode="time" display="spinner" onChange={handleTimeChange} />
                        ) : (
                            <>
                                <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
                                    <Ionicons name="time-outline" size={20} />
                                    <Text>{dayjs(time).format('h:mm A')}</Text>
                                </TouchableOpacity>
                                {showPicker && (
                                    <DateTimePicker value={time} mode="time" display="default" onChange={handleTimeChange} />
                                )}
                            </>
                        )}
                    </View>

                    {!existingSession && selectedDay && (
                        <View style={styles.sectionApplyTo}>
                            {scheduleModeOptions.map((mode) => (
                                <RadioButton
                                    key={mode}
                                    selectedValue={scheduleMode === mode}
                                    onPress={() => setScheduleMode(mode)}
                                >
                                    <View>
                                        <Text>{scheduleModeDictionary[mode].title}</Text>
                                        <Text style={styles.subtext}>{scheduleModeDictionary[mode].subtext}</Text>
                                    </View>
                                </RadioButton>
                            ))}
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        {existingSession ? (
                            <View style={styles.actionButtonsRow}>
                                <View style={styles.actionButtonWrapper}>
                                    <Button label="Delete" onPress={onDelete} />
                                </View>
                                <View style={styles.actionButtonWrapper}>
                                    <Button label="Update" onPress={handleConfirm} />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.actionButtonsRow}>
                                <View style={styles.actionButtonWrapper}>
                                    <Button label="Add Session" onPress={handleConfirm} />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 20,
        top: 0,
        backgroundColor: 'rgba(226, 61, 61, 0.13)',
        borderColor: 'rgba(226, 61, 61, 0.3)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        height: 45,
        width: 180,
    },
    badgeText: {
        color: 'rgba(226, 61, 61, 1)',
    },
    button: {
        width: '50%',
    },
    buttonRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    buttonSpacing: {
        marginRight: 12,
    },
    actionButtonsRow: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
		gap: 8,
    },
    actionButtonWrapper: {
        flex: 1,
        minWidth: 0,
    },
    deleteButton: {
        borderColor: '#ff3b30',
        flex: 0,
        marginRight: 12,
        paddingHorizontal: 15,
    },
    sectionApplyTo: {
        gap: 10,
        marginBottom: 20,
    },
    modalBackdrop: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    modalContent: {
        backgroundColor: '#DBE0E4',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        paddingTop: 65,
    },
    modalDate: {
        color: '#666',
        marginBottom: 20,
    },
    modalOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 2,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    primaryText: {
        color: 'white',
    },
    radio: {
        alignItems: 'center',
        borderColor: '#ccc',
        borderRadius: 10,
        borderWidth: 2,
        height: 20,
        justifyContent: 'center',
        width: 20,
    },
    radioDot: {
        backgroundColor: '#007AFF',
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    radioGroup: {
        marginBottom: 20,
    },
    radioOption: {
        borderColor: '#ccc',
        borderRadius: 5,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
        padding: 10,
    },
    radioSelected: {
        backgroundColor: '#f0f8ff',
        borderColor: '#007AFF',
    },
    datePicker: {
        marginBottom: 20,
        alignItems: 'center',
    },
    subtext: {
        color: '#666',
        fontSize: 12,
    },
    timeButton: {
        alignItems: 'center',
        borderColor: '#ccc',
        borderRadius: 5,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        padding: 10,
    },
});
