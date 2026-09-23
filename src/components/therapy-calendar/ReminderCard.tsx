import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import AppText from '../ui/AppText';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import type { CalendarReminder } from '../../api/therapy';
import { Reason } from '../../features/reminders/types';
import type { ReminderSlot } from './ReminderTimeSheet';
import { PassCard } from './PassCard';

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

type CardStyles = ReturnType<typeof makeStyles>;

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
    styles: CardStyles,
    theme: Theme,
    t: TFunction<'calendar'>,
) {
    if (reminder.status !== 'pending') {
        return (
            <View style={ styles.chip }>
                <AppText variant="caption" style={ [styles.chipLabel, reminder.status === 'missed' && styles.statusMissed] }>
                    { t(`reminder.status.${reminder.status}`) }
                </AppText>
            </View>
        );
    }

    const slot = reminderSlot(reminder);
    if (slot === null || !onEditTime) {
        return (
            <View style={ styles.chip }>
                <AppText variant="caption" style={ styles.chipLabel }>{ t('reminder.fixedTime') }</AppText>
            </View>
        );
    }

    // The card's one action, lit like a badge: a blue pill that throws a
    // blue shadow, so it reads as the thing to press before it is read.
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityHint={ t('a11y.opensTimePicker') }
            activeOpacity={ 0.85 }
            onPress={ () => onEditTime(slot) }
            style={ styles.updateButton }
            testID={ `reminder-sheet.${reminder.id}.update` }
        >
            <LinearGradient
                colors={ theme.calendar.eventCard.action.fill }
                start={ { x: 0, y: 0 } }
                end={ { x: 1, y: 1 } }
                style={ styles.updateFill }
            >
                <AppText variant="caption" style={ styles.updateLabel }>{ t('reminder.update') }</AppText>
            </LinearGradient>
        </TouchableOpacity>
    );
}

type ReminderCardProps = {
    reminder: CalendarReminder;
    /** Which review moment this is. */
    headline: string;
    /** The session the reminder hangs off, set beside the time. */
    sessionDate?: string | null;
    /** Why the moment is there, in the band along the foot. */
    reason: string;
    /** Opens the picker for the reminder's slot; absent leaves it read-only. */
    onEditTime?: (slot: ReminderSlot) => void;
    /** Opens the write-up behind the moment; only the review moments have one. */
    onOpenScience?: () => void;
};

/**
 * One reminder, cut like the calendar's next-event cards: the moment and its
 * time in the reading, the reason it is there in the band below the break.
 */
export function ReminderCard({ reminder, headline, sessionDate, reason, onEditTime, onOpenScience }: ReminderCardProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <PassCard
            translucent
            testID={ `reminder-sheet.${reminder.id}` }
            footer={
                <View style={ styles.reasonRow }>
                    <AppText variant="body" style={ styles.reason }>{ reason }</AppText>
                    { onOpenScience ? (
                        <Ionicons name="arrow-forward-outline" size={ 20 } color={ theme.ink.primary } style={ styles.whyArrow } />
                    ) : null }
                </View>
            }
            // The whole band opens the write-up, not just the arrow: the
            // reason is what a reader is looking at when they want to know
            // more. It is read out as the reason, then where it leads.
            footerAction={ onOpenScience ? {
                onPress: onOpenScience,
                accessibilityLabel: reason,
                accessibilityHint: t('reminder.whyThis'),
                testID: `reminder-sheet.${reminder.id}.why`,
            } : undefined }
        >
            <View style={ styles.cardHeader }>
                <AppText variant="caption" style={ styles.headline }>
                    { headline.toUpperCase() }
                </AppText>
                { reminderAction(reminder, onEditTime, styles, theme, t) }
            </View>
            <View style={ styles.timeRow }>
                <AppText variant="h1" style={ styles.time }>
                    { dayjs(reminder.dueAtUtc).format('LT') }
                </AppText>
                { sessionDate ? (
                    <AppText variant="h1" style={ styles.sessionDate }>{ sessionDate }</AppText>
                ) : null }
            </View>
        </PassCard>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    cardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    headline: {
        color: theme.ink.primary,
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    // A status the card only reports sits in a quiet pill, where the
    // action would otherwise be, in the foot band's tone so it reads as part
    // of the card rather than laid on it.
    chip: {
        backgroundColor: theme.calendar.eventCard.footer,
        borderColor: theme.calendar.eventCard.footerRule,
        borderRadius: 999,
        borderWidth: 1,
        marginLeft: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    chipLabel: {
        color: theme.ink.tertiary,
        fontSize: 12,
        lineHeight: 16,
    },
    statusMissed: {
        color: theme.status.dangerText,
    },
    // The shadow is on the touchable and the fill on the gradient inside it,
    // so the glow falls round the pill rather than being clipped by it.
    updateButton: {
        borderRadius: 999,
        elevation: 6,
        marginLeft: 12,
        shadowColor: theme.calendar.eventCard.action.shadow,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
    },
    updateFill: {
        borderColor: theme.calendar.eventCard.action.rim,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 7,
    },
    updateLabel: {
        color: theme.calendar.eventCard.action.label,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 16,
    },
    time: {
        color: theme.ink.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 36,
    },
    // The date sits on the time's baseline in the card's quietest ink: it
    // says which session, and the time stays the reading.
    timeRow: {
        alignItems: 'baseline',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    sessionDate: {
        color: theme.ink.tertiary,
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 20,
        marginLeft: 4,
        opacity: 0.75,
    },
    reasonRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    reason: {
        color: theme.ink.secondary,
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 19,
    },
    // The settings rows' arrow, bare: the band is already the surface, and
    // the button.
    whyArrow: {
        marginLeft: 'auto',
    },
});
