import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
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
import ReminderTimeSheet, { type ReminderSlot } from './ReminderTimeSheet';
import { ReminderCard } from './ReminderCard';
import { SheetGlow } from './SheetGlow';

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
                    <LinearGradient
                        colors={ [theme.calendar.sheet.surface, theme.calendar.eventCard.ground[theme.calendar.eventCard.ground.length - 1]] }
                        pointerEvents="none"
                        style={ StyleSheet.absoluteFill }
                    />
                    <SheetGlow />
                    <AppText variant="h2" style={ styles.day }>{ dayjs(selectedDate).format('dddd D') }</AppText>
                    { reminders.map((reminder) => {
                        const reason = reminder.reason ? neuroReminderCopy()[reminder.reason].reason : t('reminder.logNote.reason');
                        // The session the reminder hangs off: the one it comes
                        // before, or otherwise the one it follows. The card
                        // sets its date beside the time, where it reads as
                        // the when, and leaves the headline to say the what.
                        const sessionDate = reminder.reason === 'pre_session'
                            ? sessionLabel(reminder.nextSessionId)
                            : sessionLabel(reminder.sessionId);
                        // Only the four review moments have a write-up behind
                        // them; the post-session note is a prompt, not an
                        // interval, and has nothing to open.
                        const link = reminder.reason ? neuroReminderCopy()[reminder.reason].link : null;
                        return (
                            <ReminderCard
                                key={ reminder.id }
                                reminder={ reminder }
                                headline={ reminderHeadline(reminder, t) }
                                sessionDate={ sessionDate }
                                reason={ reason }
                                onEditTime={ canEditTime ? setEditingSlot : undefined }
                                onOpenScience={ link ? () => setScienceLink(link) : undefined }
                            />
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
        overflow: 'hidden',
        padding: 20,
        paddingBottom: 40,
    },
    day: {
        color: theme.ink.secondary,
        fontSize: 20,
        fontWeight: '300',
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
