import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Platform, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

import Loading from '../ui/Loading';
import RadioButton from '../ui/RadioButton';
import { GlassPillButton } from '../ui/GlassPillButton';
import { GlassPickerPanel } from '../ui/GlassPickerPanel';
import { PresentedModal } from '../ui/PresentedModal';
import AppText from '../ui/AppText';
import { TIME_PICKER_BOUNDS } from '../../utils/timePickerBounds';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { useTranslation } from 'react-i18next';
import type { SessionCadence, SessionEditScope } from '../../api/therapy';

/** What the sheet knows about the appointment already on the day, if any. */
export interface SheetSession {
    id: string;
    time: Date;
    /** True when the appointment belongs to a repeating series. */
    inSeries: boolean;
}

/** A new appointment: one off, or the first of a weekly series. */
export type ScheduleMode = 'single' | SessionCadence;

interface ScheduleModalProps {
    visible: boolean;
    embedded?: boolean;
    selectedDate: string | null;
    existingSession: SheetSession | null;
    defaultTime: Date;
    /** Set while a commit is on its way to the server. */
    busy?: boolean;
    onAdd: (mode: ScheduleMode, time: Date) => void;
    onUpdate: (time: Date, scope: SessionEditScope) => void;
    onDelete: (scope: SessionEditScope) => void;
    onCancel: () => void;
}

/**
 * The room a RadioButton's shadow needs outside the box it is drawn on.
 *
 * `shadowOffset` 8 plus `shadowRadius` 14, rounded up. A ScrollView clips to
 * its own bounds, so without this the cards' shadows were cut off in a hard
 * line along the bottom of the scroller and down both of its sides.
 */
const SHADOW_ROOM = 28;

/**
 * The sheet a day opens into. Every button commits straight away: there is no
 * draft to save afterwards, so what this sheet confirms is what the server
 * holds by the time it closes.
 */
export default function ScheduleModal({
    visible,
    embedded = false,
    selectedDate,
    existingSession,
    defaultTime,
    busy = false,
    onAdd,
    onUpdate,
    onDelete,
    onCancel,
}: ScheduleModalProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [time, setTime] = useState(defaultTime);
    const [mode, setMode] = useState<ScheduleMode>('weekly');
    const [scope, setScope] = useState<SessionEditScope>('this');
    const [showPicker, setShowPicker] = useState(false);
    const [confirmingEndSeries, setConfirmingEndSeries] = useState(false);
    const existingSessionId = existingSession?.id;
    const initialTimeMs = (existingSession?.time ?? defaultTime).getTime();

    useEffect(() => {
        if (visible) {
            setTime(new Date(initialTimeMs));
            setMode('weekly');
            setScope('this');
            setShowPicker(false);
            setConfirmingEndSeries(false);
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

    // Ending a series removes every later appointment in one go, which is the
    // one edit on this screen that cannot be undone by tapping again, so it
    // asks first. The question is raised from inside this sheet rather than
    // through the app-wide alert: the alert is a modal of its own, and iOS
    // refuses to present one modal over another, which is how this button
    // came to do nothing at all.
    const handleDeletePress = () => {
        if (scope === 'future') {
            setConfirmingEndSeries(true);
            return;
        }
        onDelete('this');
    };

    const isUpdateDisabled = busy || (!!existingSession && existingSession.time.getTime() === time.getTime());
    const selectedDay = selectedDate ? dayjs(selectedDate) : null;
    const selectedWeekday = selectedDay?.format('dddd') ?? '';

    const modeOptions: Array<{ value: ScheduleMode; title: string; note?: string }> = [
        { value: 'weekly', title: t('schedule.everyWeek') },
        { value: 'single', title: t('schedule.thisDayOnly') },
    ];
    const scopeOptions: Array<{ value: SessionEditScope; title: string; note?: string }> = [
        { value: 'this', title: t('schedule.thisSessionOnly') },
        { value: 'future', title: t('schedule.allFutureSessions'), note: t('schedule.allFutureNote') },
    ];

    const renderOptions = <Value extends string>(
        options: Array<{ value: Value; title: string; note?: string }>,
        selected: Value,
        select: (value: Value) => void,
    ) => (
        <View style={ styles.sectionApplyTo }>
            { options.map((option) => (
                <RadioButton
                    key={ option.value }
                    selectedValue={ selected === option.value }
                    onPress={ () => select(option.value) }
                >
                    <View style={ styles.modeRow }>
                        <AppText variant="body" numberOfLines={ 1 } style={ styles.modeTitle }>
                            { option.title.toUpperCase() }
                        </AppText>
                        { option.note ? (
                            <AppText variant="caption" style={ styles.modeNote }>
                                { option.note.toUpperCase() }
                            </AppText>
                        ) : null }
                    </View>
                </RadioButton>
            )) }
        </View>
    );

    if (!visible) return null;

    const content = (
            <View style={ styles.modalOverlay }>
                <TouchableOpacity
                    style={ styles.modalBackdrop }
                    activeOpacity={ 1 }
                    onPress={ busy ? undefined : onCancel }
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

                    <ScrollView
                        style={ styles.scrollContent }
                        contentContainerStyle={ styles.scrollInner }
                        bounces={ false }
                    >
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

                        { !existingSession && selectedDay ? renderOptions(modeOptions, mode, setMode) : null }
                        { existingSession?.inSeries ? renderOptions(scopeOptions, scope, setScope) : null }
                    </ScrollView>

                    <View style={ styles.buttonRow }>
                        { existingSession ? (
                            // Side by side while the destructive action is
                            // just "Delete". Naming the scope makes that
                            // label far too long for half a row, and a pill
                            // is a single-line control that answers a long
                            // label by shrinking the type, so it takes a row
                            // of its own instead. `column-reverse` keeps
                            // Update on top without reordering the source.
                            <View style={ [
                                styles.actionButtonsRow,
                                scope === 'future' && styles.actionButtonsStacked,
                            ] }>
                                <View style={ scope === 'future' ? styles.actionButtonFull : styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label={ scope === 'future'
                                            ? t('schedule.allSessionsOnThisDay', { weekday: selectedWeekday })
                                            : t('schedule.delete') }
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ theme.accent.mark }
                                        disabledLabelColor={ theme.glass.disabledLabel }
                                        disabled={ busy }
                                        onPress={ handleDeletePress }
                                        style={ styles.actionPill }
                                        testID="schedule-modal.delete"
                                    />
                                </View>
                                <View style={ scope === 'future' ? styles.actionButtonFull : styles.actionButtonWrapper }>
                                    <GlassPillButton
                                        label={ t('schedule.update') }
                                        height={ 60 }
                                        labelSize={ 16 }
                                        labelColor={ theme.accent.mark }
                                        disabledLabelColor={ theme.glass.disabledLabel }
                                        onPress={ () => onUpdate(time, scope) }
                                        disabled={ isUpdateDisabled }
                                        style={ styles.actionPill }
                                        testID="schedule-modal.update"
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
                                        disabledLabelColor={ theme.glass.disabledLabel }
                                        disabled={ busy }
                                        onPress={ () => onAdd(mode, time) }
                                        style={ styles.actionPill }
                                        testID="schedule-modal.add"
                                    />
                                </View>
                            </View>
                        ) }
                    </View>

                </View>

                { /* Confirm inside the existing modal to avoid native presentation races. */ }
                { confirmingEndSeries ? (
                        <View style={ styles.confirmOverlay }>
                            <TouchableOpacity
                                style={ styles.modalBackdrop }
                                activeOpacity={ 1 }
                                onPress={ () => setConfirmingEndSeries(false) }
                                accessibilityRole="button"
                                accessibilityLabel={ t('schedule.keepSeries') }
                            />
                            <View style={ styles.confirmSheet } testID="schedule-modal.end-series-confirm">
                                <AppText variant="h2" style={ styles.confirmTitle }>
                                    { t('schedule.endSeriesTitle') }
                                </AppText>
                                <AppText variant="body" style={ styles.confirmMessage }>
                                    { t('schedule.endSeriesMessage') }
                                </AppText>
                                { /*
                                    The label keeps GlassPillButton's default
                                    white: in the light theme `dangerText` is
                                    the same red as `danger`, so taking it
                                    here would paint the word onto its own
                                    background.
                                */ }
                                <GlassPillButton
                                    label={ t('schedule.endSeries') }
                                    height={ 60 }
                                    labelSize={ 16 }
                                    fillColor={ theme.status.danger }
                                    disabled={ busy }
                                    disabledLabelColor={ theme.glass.disabledLabel }
                                    onPress={ () => {
                                        setConfirmingEndSeries(false);
                                        onDelete('future');
                                    } }
                                    testID="schedule-modal.end-series-confirm.confirm"
                                />
                                <GlassPillButton
                                    label={ t('schedule.keepSeries') }
                                    height={ 60 }
                                    labelSize={ 16 }
                                    labelColor={ theme.accent.mark }
                                    onPress={ () => setConfirmingEndSeries(false) }
                                    testID="schedule-modal.end-series-confirm.keep"
                                />
                            </View>
                        </View>

                ) : null }
                { busy && (
                    <View style={ [StyleSheet.absoluteFillObject, { backgroundColor: theme.ground.base }] } accessibilityLabel={ t('schedule.saving') }>
                        <Loading fullScreen />
                    </View>
                ) }
            </View>
    );
    return embedded ? content : (
        <PresentedModal visible={ visible } transparent animationType="slide" onRequestClose={ () => { if (!busy) { if (confirmingEndSeries) setConfirmingEndSeries(false); else onCancel(); } } }>
            { content }
        </PresentedModal>
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
    actionButtonsStacked: {
        flexDirection: 'column-reverse',
        gap: 10,
    },
    actionButtonFull: {
        alignSelf: 'stretch',
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
    // Widened past the sheet's own padding, with the padding put back on the
    // content inside it, so the option cards have room to cast their shadow
    // before the scroller's bounds clip it.
    scrollContent: {
        flexGrow: 0,
        flexShrink: 1,
        marginHorizontal: -SHADOW_ROOM,
    },
    scrollInner: {
        paddingBottom: SHADOW_ROOM + 4,
        paddingHorizontal: SHADOW_ROOM,
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
    iosPicker: {},
    timeButton: {
        alignItems: 'center',
        borderColor: theme.calendar.sheet.border,
        borderRadius: 5,
        flexDirection: 'row',
        gap: 10,
        padding: 10,
    },
    timeLabel: {},
    busy: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    confirmOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.calendar.sheet.overlay,
        flex: 1,
        justifyContent: 'flex-end',
    },
    confirmSheet: {
        backgroundColor: theme.calendar.sheet.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        gap: 14,
        padding: 20,
        paddingBottom: 40,
    },
    confirmTitle: {
        color: theme.ink.primary,
        fontSize: 20,
        fontWeight: '500',
    },
    confirmMessage: {
        color: theme.ink.secondary,
    },
});
