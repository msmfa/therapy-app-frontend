import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import type { CalendarReminder, TherapySession } from '../../api/therapy';
import { neuroReminderCopy } from '../../constants/neuroReminders';

interface ReminderSheetProps {
    visible: boolean;
    /** YYYY-MM-DD of the day that was pressed. */
    selectedDate: string | null;
    reminders: CalendarReminder[];
    /** Every session the calendar holds, to name the one a reminder follows. */
    sessions: TherapySession[];
    /** Offered on a day still ahead with nothing booked, so the dot is not a dead end. */
    onAddSession?: () => void;
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

export default function ReminderSheet({ visible, selectedDate, reminders, sessions, onAddSession, onClose }: ReminderSheetProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    if (!visible || !selectedDate) return null;

    const sessionById = new Map(sessions.map((session) => [session._id, session]));
    const sessionLabel = (id?: string) => {
        const session = id ? sessionById.get(id) : undefined;
        return session ? dayjs(session.startsAtUtc).format('ddd D MMM') : null;
    };

    return (
        <Modal visible transparent animationType="slide" onRequestClose={ onClose }>
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onClose }
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissReminder') }
                />
                <View style={ styles.content }>
                    <AppText variant="h2" style={ styles.day }>{ dayjs(selectedDate).format('dddd D') }</AppText>
                    { reminders.map((reminder) => {
                        const reason = reminder.reason ? neuroReminderCopy()[reminder.reason].reason : t('reminder.logNote.reason');
                        const follows = sessionLabel(reminder.sessionId);
                        const precedes = reminder.reason === 'pre_session' ? sessionLabel(reminder.nextSessionId) : null;
                        return (
                            <View key={ reminder.id } style={ styles.card } testID={ `reminder-sheet.${reminder.id}` }>
                                <View style={ styles.cardHeader }>
                                    <AppText variant="caption" style={ styles.headline }>
                                        { reminderHeadline(reminder, t).toUpperCase() }
                                    </AppText>
                                    <AppText variant="caption" style={ [styles.status, reminder.status === 'missed' && styles.statusMissed] }>
                                        { t(`reminder.status.${reminder.status}`) }
                                    </AppText>
                                </View>
                                <AppText variant="h1" style={ styles.time }>
                                    { dayjs(reminder.dueAtUtc).format('LT') }
                                </AppText>
                                <AppText variant="body" style={ styles.reason }>{ reason }</AppText>
                                { precedes ? (
                                    <AppText variant="caption" style={ styles.meta }>
                                        { t('reminder.beforeSession', { date: precedes }) }
                                    </AppText>
                                ) : follows ? (
                                    <AppText variant="caption" style={ styles.meta }>
                                        { t('reminder.afterSession', { date: follows }) }
                                    </AppText>
                                ) : null }
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
                </View>
            </View>
        </Modal>
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
    time: {
        color: theme.ink.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 36,
    },
    reason: {
        color: theme.ink.secondary,
    },
    meta: {
        color: theme.ink.tertiary,
        fontSize: 13,
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
