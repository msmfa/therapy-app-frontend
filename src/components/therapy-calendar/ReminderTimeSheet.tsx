import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { GlassPickerPanel } from '../ui/GlassPickerPanel';
import { PresentedModal } from '../ui/PresentedModal';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { TIME_PICKER_BOUNDS } from '../../utils/timePickerBounds';
import { dateToMinutes, minutesToDate } from '../../features/onboarding/formatting';

/** Which of the two wall-clock times a reminder is pinned to. */
export type ReminderSlot = 'morning' | 'evening';

interface ReminderTimeSheetProps {
    visible: boolean;
    embedded?: boolean;
    slot: ReminderSlot;
    /** The time the slot currently holds, as minutes into the local day. */
    minutes: number;
    busy?: boolean;
    onSave: (minutes: number) => void | Promise<unknown>;
    onCancel: () => void;
}

/**
 * Moves the morning or the evening reminder time.
 *
 * There is one morning time and one evening time for the whole account, and
 * this edits those, so it is opened from a single day but never means only
 * that day. The message says so outright: a sheet that is opened on Tuesday
 * and quietly rewrites every Thursday as well would be a trap otherwise. The
 * post-session note is not reachable from here at all, since it is pinned to
 * the session rather than to a time of day.
 */
export default function ReminderTimeSheet({ visible, slot, minutes, embedded = false, busy = false, onSave, onCancel }: ReminderTimeSheetProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [time, setTime] = useState(() => minutesToDate(minutes));
    const [showPicker, setShowPicker] = useState(false);

    // Reopening on the other slot has to start from that slot's own time
    // rather than whatever the wheel was left on.
    useEffect(() => {
        if (visible) setTime(minutesToDate(minutes));
    }, [visible, minutes, slot]);

    if (!visible) return null;

    const picked = dateToMinutes(time);
    const changed = picked !== minutes;

    const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
        if (Platform.OS !== 'ios') setShowPicker(false);
        // A dismissed picker reports the value it was already showing, not a
        // choice; writing it back would overwrite the pick just made.
        if (event.type === 'dismissed') return;
        if (!picked || !Number.isFinite(picked.getTime())) return;
        setTime(picked);
    };

    const content = (
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onCancel }
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissHint') }
                />
                <View style={ styles.content } testID="reminder-time-sheet">
                    <AppText variant="h2" style={ styles.title }>{ t(`reminder.time.${slot}Title`) }</AppText>
                    <AppText variant="body" style={ styles.message }>{ t(`reminder.time.${slot}Message`) }</AppText>

                    <View style={ styles.picker }>
                        { Platform.OS === 'ios' ? (
                            <GlassPickerPanel style={ styles.iosPickerWrapper }>
                                <DateTimePicker
                                    { ...TIME_PICKER_BOUNDS }
                                    accentColor={ theme.accent.mark }
                                    value={ time }
                                    mode="time"
                                    display="spinner"
                                    onChange={ handleChange }
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
                                    <Ionicons name="time-outline" size={ 20 } color={ theme.ink.secondary } />
                                    <AppText variant="body" style={ styles.timeLabel }>{ dayjs(time).format('LT') }</AppText>
                                </TouchableOpacity>
                                { showPicker && (
                                    <GlassPickerPanel style={ styles.androidPicker }>
                                        <DateTimePicker
                                            { ...TIME_PICKER_BOUNDS }
                                            accentColor={ theme.accent.mark }
                                            value={ time }
                                            mode="time"
                                            display="default"
                                            onChange={ handleChange }
                                            themeVariant={ theme.scheme }
                                        />
                                    </GlassPickerPanel>
                                ) }
                            </>
                        ) }
                    </View>

                    { /*
                        One button, which says what pressing it will do. Until
                        the wheel is moved there is nothing to save, and a Save
                        beside a Close invites the question of which one keeps
                        the time; once it has moved, Close would throw the pick
                        away without saying so.
                    */ }
                    <View style={ styles.buttons }>
                        <GlassPillButton
                            label={ changed ? t('reminder.time.save') : t('reminder.close') }
                            height={ 60 }
                            labelSize={ 16 }
                            labelColor={ theme.accent.mark }
                            disabled={ busy }
                            disabledLabelColor={ theme.glass.disabledLabel }
                            onPress={ () => (changed ? onSave(picked) : onCancel()) }
                            style={ styles.button }
                        />
                    </View>
                </View>
            </View>
    );
    return embedded ? content : (
        <PresentedModal visible transparent animationType="slide" onRequestClose={ onCancel }>
            { content }
        </PresentedModal>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        backgroundColor: theme.calendar.sheet.overlay,
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: theme.calendar.sheet.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        gap: 14,
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        color: theme.ink.primary,
        fontSize: 20,
        fontWeight: '500',
    },
    message: {
        color: theme.ink.secondary,
    },
    picker: {
        alignItems: 'center',
    },
    iosPickerWrapper: {
        alignSelf: 'stretch',
    },
    iosPicker: {
        alignSelf: 'center',
        height: 180,
        width: '100%',
    },
    timeButton: {
        alignItems: 'center',
        borderColor: theme.calendar.sheet.border,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    timeLabel: {
        color: theme.ink.primary,
    },
    androidPicker: {
        marginTop: 12,
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        minWidth: 0,
    },
});
