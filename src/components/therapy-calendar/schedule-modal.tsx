import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import RadioButton from '../ui/RadioButton';
import { Button } from '../ui/button';
import AppText from '../ui/typography';
import Badge from '../ui/Badge';
import { colors } from 'new-design';

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
                ? `Every ${selectedDay.format('dddd')} for the next 2 months`
                : 'Every week for the next 2 months',
        },
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
                <View style={styles.modalContent}>
                    {selectedDay && (
                        <Badge addedStyles={styles.badge} tabWithBorder hue={220}>
                            {selectedDay.format('dddd Do')}
                        </Badge>
                    )}

                    <View style={styles.datePicker}>
                        {Platform.OS === 'ios' ? (
                            <View style={styles.iosPickerWrapper}>
                                <DateTimePicker
                                    value={time}
                                    mode="time"
                                    display="spinner"
                                    onChange={handleTimeChange}
                                    textColor={ colors.text}
                                    themeVariant="light"
                                    style={styles.iosPicker}
                                />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
                                    <Ionicons name="time-outline" size={20} />
                                    <AppText style={styles.timeLabel} variant='body'>
                                        {dayjs(time).format('h:mm A')}
                                    </AppText>
                                </TouchableOpacity>
                                {showPicker && (
                                    <DateTimePicker
                                        value={time}
                                        mode="time"
                                        display="default"
                                        onChange={handleTimeChange}
                                        themeVariant="light"
                                    />
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
                                        <AppText variant='body'>
                                            {scheduleModeDictionary[mode].title}
                                        </AppText>
                                        <AppText variant='caption'>
                                            {scheduleModeDictionary[mode].subtext}
                                        </AppText>
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
        height: 45,
        width: 180,
    },
    buttonRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
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
        backgroundColor: colors.bgLight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        paddingTop: 65,
    },
    modalOverlay: {
        backgroundColor: '#00000080',
        flex: 1,
        justifyContent: 'flex-end',
    },
    datePicker: {
        marginBottom: 20,
        alignItems: 'center',
    },
    iosPickerWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 10,
        width: '100%',
    },
    iosPicker: {
        width: '100%',
    },
    subtext: {
        fontSize: 12,
    },
    timeButton: {
        alignItems: 'center',
        borderColor: '#CCCCCC',
        borderRadius: 5,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 10,
        padding: 10,
    },
    timeLabel: {
    },
});
