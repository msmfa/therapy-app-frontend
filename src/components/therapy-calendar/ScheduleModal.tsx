import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import RadioButton from '../ui/RadioButton';
import { GlassPillButton } from '../ui/GlassPillButton';
import { GlassPickerPanel } from '../ui/GlassPickerPanel';
import AppText from '../ui/AppText';
import { TIME_PICKER_BOUNDS } from '../../utils/timePickerBounds';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { useTranslation } from 'react-i18next';

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
    weeklyRepeatCount?: number;
    sessionsOnDay?: Session[];
    onSelectSession?: (id: string) => void;
}

export default function ScheduleModal({
    visible,
    selectedDate,
    existingSession,
    defaultTime,
    onConfirm,
    onDelete,
    onCancel,
    weeklyRepeatCount = 8,
    sessionsOnDay = [],
    onSelectSession,
}: ScheduleModalProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [time, setTime] = useState(defaultTime);
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekly_pattern');
    const [showPicker, setShowPicker] = useState(false);
    const existingSessionId = existingSession?.id;
    const initialTimeMs = (existingSession?.time ?? defaultTime).getTime();

    useEffect(() => {
        if (visible) {
            setTime(new Date(initialTimeMs));
            setScheduleMode(existingSessionId === undefined ? 'weekly_pattern' : 'single');
            setShowPicker(false);
        }
        // Parent refreshes can recreate the same Date/session objects while
        // this sheet is open. Reset only when the actual selected session or
        // saved time changes, so a refresh cannot undo a wheel edit.
    }, [visible, selectedDate, existingSessionId, initialTimeMs]);

    const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (event.type === 'dismissed') return;

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
        single: { title: t('schedule.thisDayOnly') },
        weekly_pattern: {
            title: t('schedule.everyWeek'),
            // The count was pluralised by hand with a ternary, which only ever
            // works for a language whose rule is "one, then add an s".
            note: weeklyRepeatCount === 8
                ? t('schedule.nextTwoMonths')
                : t('schedule.repeatCount', { count: weeklyRepeatCount }),
        },
    };

    if (!visible) return null;

    return (
        <Modal visible={ visible } transparent animationType="slide" onRequestClose={ onCancel }>
            <View style={ styles.modalOverlay }>
                <TouchableOpacity
                    style={ styles.modalBackdrop }
                    activeOpacity={ 1 }
                    onPress={ onCancel }
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissScheduling') }
                />
                <View style={ styles.modalContent }>
                    { selectedDay && (
                        <View style={ styles.selectedDayBlock }>
                            <AppText variant="h2" style={ styles.selectedDay }>
                                { selectedDay.format('dddd D') }
                            </AppText>
                            <View style={ styles.selectedDayRule }>
                                { Array.from({ length: 18 }, (_unused, index) => (
                                    <View key={ index } style={ styles.selectedDayRuleDot } />
                                )) }
                            </View>
                        </View>
                    ) }

                    <ScrollView style={ styles.scrollContent } bounces={ false }>
                        { sessionsOnDay.length > 1 && onSelectSession && (
                            <View>
                                { sessionsOnDay.map(session => (
                                    <TouchableOpacity key={ session.id } accessibilityRole="button"
                                        accessibilityState={ { selected: session.id === existingSession?.id } }
                                        onPress={ () => onSelectSession(session.id) } style={ styles.timeButton }>
                                        <AppText variant="body">{ t('schedule.appointmentAt', { time: dayjs(session.time).format('LT') }) }</AppText>
                                    </TouchableOpacity>
                                )) }
                            </View>
                        ) }
                        <View style={ styles.datePicker }>
                            { Platform.OS === 'ios' ? (
                                <GlassPickerPanel style={ styles.iosPickerWrapper }>
                                    <DateTimePicker
                                        { ...TIME_PICKER_BOUNDS }
                                        accentColor={ theme.accent.mark }
                                        value={ time }
                                        mode="time"
                                        display="spinner"
                                        onChange={ handleTimeChange }
                                        textColor={ theme.ink.secondary }
                                        themeVariant={ theme.scheme }
                                        style={ styles.iosPicker }
                                    />
                                </GlassPickerPanel>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={ styles.timeButton }
                                        onPress={ () => setShowPicker(true) }
                                        accessibilityRole="button"
                                        accessibilityHint={ t('a11y.opensTimePicker') }
                                    >
                                        <Ionicons name="time-outline" size={ 20 } />
                                        <AppText style={ styles.timeLabel } variant='body'>
                                            { dayjs(time).format('LT') }
                                        </AppText>
                                    </TouchableOpacity>
                                    { showPicker && (
                                        <GlassPickerPanel style={ styles.androidPicker }>
                                            <DateTimePicker
                                                { ...TIME_PICKER_BOUNDS }
                                                accentColor={ theme.accent.mark }
                                                value={ time }
                                                mode="time"
                                                display="default"
                                                onChange={ handleTimeChange }
                                                themeVariant={ theme.scheme }
                                            />
                                        </GlassPickerPanel>
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

                    </ScrollView>
                    <View style={ styles.buttonRow }>
                        { existingSession ? (
                            <View style={ styles.actionButtonsRow }>
                                <View style={ styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label={ t('schedule.delete') }
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ theme.accent.mark }
                                        onPress={ onDelete }
                                        style={ styles.actionPill }
                                    />
                                </View>
                                <View style={ styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label={ t('schedule.update') }
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ theme.accent.mark }
                                        disabledLabelColor={ theme.glass.disabledLabel }
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
                                        label={ t('schedule.add') }
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ theme.accent.mark }
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

const makeStyles = (theme: Theme) => StyleSheet.create({
    androidPicker: {
        marginTop: 12,
    },
    // Shrinks to the date's width so the rule under it matches the text.
    selectedDayBlock: {
        left: 20,
        position: 'absolute',
        top: 24,
    },
    selectedDay: {
        color: theme.ink.secondary,
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
        backgroundColor: theme.accent.mark,
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
        color: theme.ink.quaternary,
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

    },
    modalContent: {
        maxHeight: '92%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        paddingTop: 65,
        backgroundColor: theme.calendar.sheet.surface,

    },
    modalOverlay: {
        backgroundColor: theme.calendar.sheet.overlay,
        flex: 1,
        justifyContent: 'flex-end',
    },
    scrollContent: {
        flexGrow: 0,
        flexShrink: 1,
    },
    datePicker: {
        marginBottom: 20,
        alignItems: 'center',

    },
    // The panel supplies the blur, the border and the rounding; this is the
    // room the wheel needs inside it.
    iosPickerWrapper: {
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    iosPicker: {
        // backgroundColor: 'hsl(220, 40%, 97%)',
    },
    timeButton: {
        alignItems: 'center',
        borderColor: theme.calendar.sheet.border,
        borderRadius: 5,
        flexDirection: 'row',
        gap: 10,
        padding: 10,
    },
    timeLabel: {
    },
});
