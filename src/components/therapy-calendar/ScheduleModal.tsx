import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import RadioButton from '../ui/RadioButton';
import { GlassPillButton } from '../ui/GlassPillButton';
import AppText from '../ui/AppText';
import { ACTION_ORANGE, CALENDAR_COLORS, COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';

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

    const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
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

    const isUpdateDisabled = !!existingSession && existingSession.time.getTime() === time.getTime();

    const selectedDay = selectedDate ? dayjs(selectedDate) : null;
    const scheduleModeOptions: ScheduleMode[] = ['weekly_pattern', 'single'];
    const scheduleModeDictionary: Record<string, { title: string; note?: string }> = {
        single: { title: 'This day only' },
        weekly_pattern: { title: 'Every week', note: 'For the next two months' },
    };

    if (!visible) return null;

    return (
        <Modal visible={ visible } transparent animationType="slide" onRequestClose={ onCancel }>
            <View style={ styles.modalOverlay }>
                <TouchableOpacity style={ styles.modalBackdrop } activeOpacity={ 1 } onPress={ onCancel } />
                <View style={ styles.modalContent }>
                    { selectedDay && (
                        <View style={ styles.selectedDayBlock }>
                            <AppText variant="h2" style={ styles.selectedDay }>
                                { selectedDay.format('dddd Do') }
                            </AppText>
                            <View style={ styles.selectedDayRule }>
                                { Array.from({ length: 18 }, (_unused, index) => (
                                    <View key={ index } style={ styles.selectedDayRuleDot } />
                                )) }
                            </View>
                        </View>
                    ) }

                    <View style={ styles.datePicker }>
                        { Platform.OS === 'ios' ? (
                            <View style={ styles.iosPickerWrapper }>
                                <DateTimePicker
                                    value={ time }
                                    mode="time"
                                    display="spinner"
                                    onChange={ handleTimeChange }
                                    textColor={ COLOR_VARIANTS.black.secondary }
                                    themeVariant="light"
                                    style={ styles.iosPicker }
                                />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity style={ styles.timeButton } onPress={ () => setShowPicker(true) }>
                                    <Ionicons name="time-outline" size={ 20 } />
                                    <AppText style={ styles.timeLabel } variant='body'>
                                        { dayjs(time).format('h:mm A') }
                                    </AppText>
                                </TouchableOpacity>
                                { showPicker && (
                                    <DateTimePicker
                                        value={ time }
                                        mode="time"
                                        display="default"
                                        onChange={ handleTimeChange }
                                        themeVariant="light"
                                    />
                                ) }
                            </>
                        ) }
                    </View>

                    { !existingSession && selectedDay && (
                        <View style={ styles.sectionApplyTo }>
                            { scheduleModeOptions.map((mode) => (
                                <RadioButton
                                    key={ mode }
                                    selectedValue={ scheduleMode === mode }
                                    onPress={ () => setScheduleMode(mode) }
                                >
                                    <View style={ styles.modeRow }>
                                        <AppText
                                            variant="body"
                                            numberOfLines={ 1 }
                                            style={ styles.modeTitle }
                                        >
                                            { scheduleModeDictionary[mode].title.toUpperCase() }
                                        </AppText>
                                        { scheduleModeDictionary[mode].note ? (
                                            <AppText variant="caption" style={ styles.modeNote }>
                                                { scheduleModeDictionary[mode].note?.toUpperCase() }
                                            </AppText>
                                        ) : null }
                                    </View>
                                </RadioButton>
                            )) }
                        </View>
                    ) }

                    <View style={ styles.buttonRow }>
                        { existingSession ? (
                            <View style={ styles.actionButtonsRow }>
                                <View style={ styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label="Delete"
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ ACTION_ORANGE }
                                        onPress={ onDelete }
                                        style={ styles.actionPill }
                                    />
                                </View>
                                <View style={ styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label="Update"
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ ACTION_ORANGE }
                                        disabledLabelColor={ COLOR_VARIANTS.white.quaternary }
                                        onPress={ handleConfirm }
                                        disabled={ isUpdateDisabled }
                                        style={ styles.actionPill }
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={ styles.actionButtonsRow }>
                                <View style={ styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label="Add Session"
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ ACTION_ORANGE }
                                        onPress={ handleConfirm }
                                        style={ styles.actionPill }
                                    />
                                </View>
                            </View>
                        ) }
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    // Shrinks to the date's width so the rule under it matches the text.
    selectedDayBlock: {
        left: 20,
        position: 'absolute',
        top: 24,
    },
    selectedDay: {
        color: TEXT_COLORS.secondary,
        fontSize: 20,
        fontWeight: '300',
    },
    // Drawn rather than a text decoration, which sits tight under the baseline
    // with no way to open a gap.
    selectedDayRule: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 7,
    },
    selectedDayRuleDot: {
        backgroundColor: ACTION_ORANGE,
        borderRadius: 1.5,
        height: 3,
        width: 3,
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
    actionPill: {
        width: '100%',
    },
    modeRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // The title holds its line; the note beside it is what gives way and wraps.
    modeTitle: {
        flexShrink: 0,
        fontWeight: '600',
        letterSpacing: 0.8,
    },
    modeNote: {
        color: TEXT_COLORS.quaternary,
        flexShrink: 1,
        fontSize: 10,
        letterSpacing: 0.6,
        lineHeight: 14,
        marginLeft: 12,
        textAlign: 'right',
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
        // backgroundColor: CALENDAR_COLORS.modalSurface,

    },
    modalContent: {
        // backgroundColor: CALENDAR_COLORS.modalSurface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        paddingTop: 65,
        backgroundColor: CALENDAR_COLORS.modalSurface,
        // shadowColor: CALENDAR_COLORS.modalOverlayTransparent,

    },
    modalOverlay: {
        backgroundColor: CALENDAR_COLORS.modalOverlayTransparent,
        flex: 1,
        justifyContent: 'flex-end',
    },
    datePicker: {
        marginBottom: 20,
        alignItems: 'center',

    },
    iosPickerWrapper: {
        // backgroundColor: 'hsl(220, 40%, 97%)',
        borderRadius: 18,
        overflow: 'hidden',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    iosPicker: {
        // backgroundColor: 'hsl(220, 40%, 97%)',
    },
    timeButton: {
        alignItems: 'center',
        borderColor: CALENDAR_COLORS.modalBorder,
        borderRadius: 5,
        flexDirection: 'row',
        gap: 10,
        padding: 10,
    },
    timeLabel: {
    },
});
