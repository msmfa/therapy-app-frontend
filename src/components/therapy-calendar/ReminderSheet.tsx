import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import Loading from '../ui/Loading';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { PresentedModal } from '../ui/PresentedModal';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import type { CalendarReminder, TherapySession } from '../../api/therapy';
import { neuroReminderCopy, reminderScienceCopy } from '../../constants/neuroReminders';
import { AppModal } from '../Modal';
import { ScienceTextModal } from '../ScienceTextModal';
import type { ReminderType } from '../../utils/types';
import { Reason } from '../../features/reminders/types';
import ReminderTimeSheet, { type ReminderSlot } from './ReminderTimeSheet';

interface ReminderSheetProps {
    visible: boolean;
    embedded?: boolean;
    /** YYYY-MM-DD of the day that was pressed. */
    selectedDate: string | null;
    reminders: CalendarReminder[];
    /** Every session the calendar holds, to name the one a reminder follows. */
    sessions: TherapySession[];
    /** Offered on a day still ahead with nothing booked, so the dot is not a dead end. */
    onAddSession?: () => void;
    /** The account's two wall-clock times, to seed the picker. */
    slotMinutes?: { morning: number; evening: number } | null;
    /** Moves every reminder in a slot to a new time; absent leaves them read-only. */
    onSaveSlotTime?: (slot: ReminderSlot, minutes: number) => void | Promise<unknown>;
    busy?: boolean;
    onClose: () => void;
}

/**
 * Which wall-clock time a reminder takes, or none.
 *
 * The post-session note is the odd one out: it is placed against the session
 * that has just finished, not against a time of day, so it moves only when
 * the session does and there is nothing here for a picker to change.
 */
export function reminderSlot(reminder: CalendarReminder): ReminderSlot | null {
    if (reminder.kind === 'log_note') return null;
    return reminder.reason === Reason.PostSleep ? 'morning' : 'evening';
}

/**
 * What a reminder day is about.
 *
 * The month only has room for dots. This is where the dot gets its words: which
 * of the review moments it is, why that moment, when the push arrives, and what
 * became of it if it has already gone out. Everything here is read straight
 * off the plan the server sends from, so it cannot describe a push that will
 * not happen.
 */
export function reminderHeadline(reminder: CalendarReminder, t: TFunction<'calendar'>): string {
    if (reminder.kind === 'log_note') return t('reminder.logNote.title');
    return reminder.reason ? neuroReminderCopy()[reminder.reason].time : t('reminder.review.title');
}

type SheetStyles = ReturnType<typeof makeStyles>;

/**
 * The right-hand side of a reminder card.
 *
 * A reminder still to come is something that can be acted on, so it offers
 * the action rather than restating that it is scheduled, which the time
 * underneath already says. The post-session note has no time of day to move,
 * so it says as much in the same place. Once a reminder has gone out or been
 * missed it is history, and history reports what happened.
 */
function reminderAction(
    reminder: CalendarReminder,
    onEditTime: ((slot: ReminderSlot) => void) | undefined,
    styles: SheetStyles,
    t: TFunction<'calendar'>,
) {
    if (reminder.status !== 'pending') {
        return (
            <AppText variant="caption" style={ [styles.status, reminder.status === 'missed' && styles.statusMissed] }>
                { t(`reminder.status.${reminder.status}`) }
            </AppText>
        );
    }

    const slot = reminderSlot(reminder);
    if (slot === null || !onEditTime) {
        return (
            <AppText variant="caption" style={ styles.status }>{ t('reminder.fixedTime') }</AppText>
        );
    }

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityHint={ t('a11y.opensTimePicker') }
            onPress={ () => onEditTime(slot) }
            style={ styles.updateButton }
            testID={ `reminder-sheet.${reminder.id}.update` }
        >
            <AppText variant="caption" style={ styles.updateLabel }>{ t('reminder.update') }</AppText>
        </TouchableOpacity>
    );
}

export default function ReminderSheet({
    visible, embedded = false, selectedDate, reminders, sessions, onAddSession, slotMinutes, onSaveSlotTime, busy = false, onClose,
}: ReminderSheetProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [editingSlot, setEditingSlot] = useState<ReminderSlot | null>(null);
    const [scienceLink, setScienceLink] = useState<ReminderType | null>(null);

    if (!visible || !selectedDate) return null;

    // Only offered when there is somewhere to write the new time to and a
    // current one to open the wheel on.
    const canEditTime = Boolean(onSaveSlotTime && slotMinutes);

    const sessionById = new Map(sessions.map((session) => [session._id, session]));
    const sessionLabel = (id?: string) => {
        const session = id ? sessionById.get(id) : undefined;
        return session ? dayjs(session.startsAtUtc).format('ddd D MMM') : null;
    };

    const closeActive = () => {
        if (busy) return;
        if (editingSlot) setEditingSlot(null);
        else if (scienceLink) setScienceLink(null);
        else onClose();
    };
    const content = (
            <View style={ styles.overlay }>
                { !editingSlot && !scienceLink && <>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onClose }
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissReminder') }
                />
                <ScrollView style={ { maxHeight: '90%', flexGrow: 0 } } contentContainerStyle={ styles.content }>
                    <AppText variant="h2" style={ styles.day }>{ dayjs(selectedDate).format('dddd D') }</AppText>
                    { reminders.map((reminder) => {
                        const reason = reminder.reason ? neuroReminderCopy()[reminder.reason].reason : t('reminder.logNote.reason');
                        // The session the reminder hangs off: the one it comes
                        // before, or otherwise the one it follows. It used to
                        // sit on its own line at the foot of the card, saying
                        // in a sentence what the headline can say in two words.
                        const on = reminder.reason === 'pre_session'
                            ? sessionLabel(reminder.nextSessionId)
                            : sessionLabel(reminder.sessionId);
                        const plain = reminderHeadline(reminder, t);
                        const headline = on ? t('reminder.headlineOn', { headline: plain, date: on }) : plain;
                        // Only the four review moments have a write-up behind
                        // them; the post-session note is a prompt, not an
                        // interval, and has nothing to open.
                        const link = reminder.reason ? neuroReminderCopy()[reminder.reason].link : null;
                        return (
                            <View key={ reminder.id } style={ styles.card } testID={ `reminder-sheet.${reminder.id}` }>
                                <View style={ styles.cardHeader }>
                                    <AppText variant="caption" style={ styles.headline }>
                                        { headline.toUpperCase() }
                                    </AppText>
                                    { reminderAction(reminder, canEditTime ? setEditingSlot : undefined, styles, t) }
                                </View>
                                <AppText variant="h1" style={ styles.time }>
                                    { dayjs(reminder.dueAtUtc).format('LT') }
                                </AppText>
                                <View style={ styles.reasonRow }>
                                    <AppText variant="body" style={ styles.reason }>{ reason }</AppText>
                                    { link ? (
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel={ t('reminder.whyThis') }
                                            hitSlop={ 8 }
                                            onPress={ () => setScienceLink(link) }
                                            style={ styles.whyButton }
                                            testID={ `reminder-sheet.${reminder.id}.why` }
                                        >
                                            <Ionicons name="arrow-forward-outline" size={ 18 } color={ theme.ink.primary } />
                                        </TouchableOpacity>
                                    ) : null }
                                </View>
                            </View>
                        );
                    }) }
                    <View style={ styles.buttons }>
                        { onAddSession ? (
                            <GlassPillButton
                                label={ t('schedule.add') }
                                height={ 60 }
                                labelSize={ 16 }
                                labelColor={ theme.accent.mark }
                                onPress={ onAddSession }
                                style={ styles.button }
                            />
                        ) : null }
                        <GlassPillButton
                            label={ t('reminder.close') }
                            height={ 60 }
                            labelSize={ 16 }
                            labelColor={ theme.accent.mark }
                            onPress={ onClose }
                            style={ styles.button }
                        />
                    </View>
                </ScrollView>
                </> }
                { /* All reminder views share one native presentation. */ }
                { scienceLink ? (
                    <AppModal
                        embedded
                        isVisible
                        title={ reminderScienceCopy()[scienceLink].title }
                        onClose={ () => setScienceLink(null) }
                    >
                        <ScienceTextModal type={ scienceLink } />
                    </AppModal>
                ) : null }
                { editingSlot && slotMinutes && onSaveSlotTime ? (
                    <ReminderTimeSheet
                        embedded
                        visible
                        slot={ editingSlot }
                        minutes={ slotMinutes[editingSlot] }
                        busy={ busy }
                        onSave={ async (minutes) => {
                            await onSaveSlotTime(editingSlot, minutes);
                            setEditingSlot(null);
                        } }
                        onCancel={ () => setEditingSlot(null) }
                    />
                ) : null }
                { busy && (
                    <View style={ [StyleSheet.absoluteFillObject, { backgroundColor: theme.ground.base }] }>
                        <Loading fullScreen />
                    </View>
                ) }
            </View>
    );
    return embedded ? content : (
        <PresentedModal visible transparent animationType="slide" onRequestClose={ closeActive }>
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
    day: {
        color: theme.ink.secondary,
        fontSize: 20,
        fontWeight: '300',
    },
    card: {
        borderColor: theme.calendar.sheet.border,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
        padding: 16,
    },
    cardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headline: {
        color: theme.ink.secondary,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 1.2,
    },
    status: {
        color: theme.ink.tertiary,
        fontSize: 12,
        marginLeft: 12,
    },
    statusMissed: {
        color: theme.status.dangerText,
    },
    updateButton: {
        borderColor: theme.calendar.sheet.border,
        borderRadius: 999,
        borderWidth: 1,
        marginLeft: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    updateLabel: {
        color: theme.accent.mark,
        fontSize: 12,
        fontWeight: '500',
    },
    time: {
        color: theme.ink.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 36,
    },
    reasonRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    reason: {
        color: theme.ink.secondary,
        flexShrink: 1,
    },
    whyButton: {
        alignItems: 'center',
        justifyContent: 'center',
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
