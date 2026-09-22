import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import TherapyCalendar, { createDateFromKey, formatDateKey } from '../../src/components/therapy-calendar/TherapyCalendar';
import ScheduleModal, { type ScheduleMode, type SheetSession } from '../../src/components/therapy-calendar/ScheduleModal';
import ReminderSheet, { reminderHeadline } from '../../src/components/therapy-calendar/ReminderSheet';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import type { CalendarReminder, SessionEditScope, TherapySession } from '../../src/api/therapy';
import { ApiError } from '../../src/api/client';
import ErrorModal from '../../src/components/ui/ErrorModal';
import { CalendarBackdrop } from '../../src/components/ui/CalendarBackdrop';
import { useAppAlert } from '../../src/context/alert';
import Loading from 'src/components/ui/Loading';
import AppText from 'src/components/ui/AppText';
import { GradientCard } from '../../src/components/ui/GradientCard';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../src/context/theme';
import { serverErrorMessage } from '../../src/features/errors/serverErrorMessage';
import { DEFAULT_SESSION_MINUTES } from '../../src/features/reminders/reminderScheduleConfig';

const DEFAULT_TIME = new Date(2024, 0, 1, 9, 0, 0);

type NextEventCardProps = {
    label: string;
    date: Date | null;
    /** What the event is, under the label: the review moment, or the session. */
    detail?: string | null;
    /** Matches the dots the month uses for this kind of day. */
    accent: string;
};

// Reads like a weather tile: a quiet label with a coloured dot on the shoulder,
// and the day number carrying the card the way a temperature does, with the
// month sitting up against it as the unit.
const NextEventCard = React.memo(function NextEventCard({ label, date, detail, accent }: NextEventCardProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const when = date ? dayjs(date) : null;

    return (
        <GradientCard
            addedStyles={ styles.eventCard }
            borderRadius={ 20 }
            surfaceBackgroundColor={ theme.surface.sheetCard }
            surfaceBorderColor={ theme.surface.sheetCardBorder }
        >
            <View style={ styles.eventCardBody }>
                <View style={ styles.eventValueRow }>
                    { when ? (
                        <View style={ styles.eventReading }>
                            <AppText variant="h1" style={ styles.eventDay }>{ when.format('D') }</AppText>
                            <AppText variant="h1" style={ styles.eventMonth }>{ when.format('MMM').toUpperCase() }</AppText>
                        </View>
                    ) : (
                        <AppText variant="body" style={ styles.eventEmpty }>{ t('nothingScheduled') }</AppText>
                    ) }
                    <View style={ styles.eventAside }>
                        <View style={ styles.eventLabelRow }>
                            <AppText variant="caption" style={ styles.eventLabel }>{ label }</AppText>
                            <View style={ [styles.eventDot, { backgroundColor: accent }] } />
                        </View>
                        { when && detail ? (
                            <AppText variant="caption" numberOfLines={ 1 } style={ styles.eventDetail }>{ detail }</AppText>
                        ) : null }
                        { when ? (
                            <AppText variant="caption" style={ styles.eventMeta }>{ when.format('ddd, LT') }</AppText>
                        ) : null }
                    </View>
                </View>
            </View>
        </GradientCard>
    );
});

type OpenSheet = { kind: 'schedule' | 'reminder'; dateKey: string } | null;

export default function CalendarScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { t } = useTranslation('calendar');
    const { t: tCommon } = useTranslation('common');
    const {
        sessions, scheduleSessions, reminders, nextSession, nextReminder,
        hydrated, loading, error: sessionsError, refreshSessions,
        addSession, updateSession, removeSession,
    } = useTherapySessions();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAppAlert();
    const [sheet, setSheet] = useState<OpenSheet>(null);
    const [busy, setBusy] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorDismissed, setErrorDismissed] = useState(false);

    const sessionsByDay = useMemo(() => {
        const byDay = new Map<string, TherapySession>();
        for (const session of scheduleSessions) {
            const date = new Date(session.startsAtUtc);
            if (!Number.isNaN(date.getTime())) byDay.set(formatDateKey(date), session);
        }
        return byDay;
    }, [scheduleSessions]);

    const remindersByDay = useMemo(() => {
        const byDay = new Map<string, CalendarReminder[]>();
        for (const reminder of reminders) {
            byDay.set(reminder.localDate, [...(byDay.get(reminder.localDate) ?? []), reminder]);
        }
        return byDay;
    }, [reminders]);

    const editableIds = useMemo(() => new Set(sessions.map((session) => session._id)), [sessions]);

    // A day opens into the sheet that fits it. A day still ahead opens the
    // schedule sheet, whether to add or to edit; a day with only a reminder on
    // it explains the reminder first and offers to add from there. The past
    // is read-only: its reminders can be looked at, its sessions cannot move.
    const handleDayPress = useCallback((dateKey: string) => {
        const session = sessionsByDay.get(dateKey) ?? null;
        const dayReminders = remindersByDay.get(dateKey) ?? [];
        const editable = dateKey >= formatDateKey(new Date());
        if (!editable) {
            if (dayReminders.length > 0) setSheet({ kind: 'reminder', dateKey });
            return;
        }
        if (session && editableIds.has(session._id)) {
            setSheet({ kind: 'schedule', dateKey });
            return;
        }
        setSheet({ kind: dayReminders.length > 0 ? 'reminder' : 'schedule', dateKey });
    }, [sessionsByDay, remindersByDay, editableIds]);

    const closeSheet = useCallback(() => setSheet(null), []);

    // Leaving the tab closes whatever was open; the sheet belongs to the visit.
    useFocusEffect(useCallback(() => () => setSheet(null), []));

    const reportFailure = useCallback((err: unknown) => {
        if (err instanceof ApiError && err.status === 412) {
            showAlert(t('changedTitle'), t('changedMessage'));
        } else if (err instanceof ApiError && err.code === 'appointment_day_conflict') {
            showAlert(t('schedule.dayTakenTitle'), t('schedule.dayTaken'));
        } else {
            showAlert(tCommon('error.title'), serverErrorMessage(err, t('saveFailed')));
        }
    }, [showAlert, t, tCommon]);

    const run = useCallback(async (write: () => Promise<unknown>) => {
        setBusy(true);
        try {
            await write();
            setSheet(null);
        } catch (err) {
            console.error('calendar write failed', err);
            reportFailure(err);
        } finally {
            setBusy(false);
        }
    }, [reportFailure]);

    const activeDateKey = sheet?.dateKey ?? null;
    const activeSession = activeDateKey ? sessionsByDay.get(activeDateKey) ?? null : null;
    const sheetSession: SheetSession | null = activeSession && editableIds.has(activeSession._id)
        ? { id: activeSession._id, time: new Date(activeSession.startsAtUtc), inSeries: Boolean(activeSession.seriesId) }
        : null;

    const withTime = (dateKey: string, time: Date) => {
        const start = createDateFromKey(dateKey);
        start.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return start;
    };

    const handleAdd = useCallback((mode: ScheduleMode, time: Date) => {
        if (!activeDateKey) return;
        void run(() => addSession({
            startsAtUtc: withTime(activeDateKey, time),
            durationMin: DEFAULT_SESSION_MINUTES,
            ...(mode === 'single' ? {} : { repeat: mode }),
        }));
    }, [activeDateKey, addSession, run]);

    const handleUpdate = useCallback((time: Date, scope: SessionEditScope) => {
        if (!activeDateKey || !sheetSession) return;
        void run(() => updateSession(sheetSession.id, { startsAtUtc: withTime(activeDateKey, time), scope }));
    }, [activeDateKey, sheetSession, updateSession, run]);

    const handleDelete = useCallback((scope: SessionEditScope) => {
        if (!sheetSession) return;
        if (scope === 'this') {
            void run(() => removeSession(sheetSession.id, 'this'));
            return;
        }
        // Ending a series removes every later appointment in one go, which is
        // the one edit on this screen that cannot be undone by tapping again.
        showAlert(t('schedule.endSeriesTitle'), t('schedule.endSeriesMessage'), {
            primaryAction: {
                label: t('schedule.endSeries'),
                tone: 'danger',
                onPress: () => run(() => removeSession(sheetSession.id, 'future')),
            },
            secondaryAction: { label: t('schedule.keepSeries'), onPress: () => {} },
        });
    }, [sheetSession, removeSession, run, showAlert, t, tCommon]);

    useEffect(() => {
        if (sessionsError && !errorDismissed) setErrorModalVisible(true);
        if (!sessionsError) {
            setErrorModalVisible(false);
            setErrorDismissed(false);
        }
    }, [sessionsError, errorDismissed]);

    const handleErrorModalClose = useCallback(() => {
        setErrorModalVisible(false);
        setErrorDismissed(true);
    }, []);

    const handleErrorPrimaryAction = useCallback(() => {
        if (!sessionsError) return;
        if (sessionsError.retryable) {
            setErrorDismissed(false);
            setErrorModalVisible(false);
            refreshSessions().catch(() => {});
        } else {
            handleErrorModalClose();
        }
    }, [sessionsError, refreshSessions, handleErrorModalClose]);

    if (loading && !hydrated) {
        // Keep this loader inside the tab screen. Loading's default Modal
        // covers the navigator, including the tab bar, and made a normal data
        // refresh look like the whole app had disappeared.
        return (
            <View style={ styles.container }>
                <CalendarBackdrop />
                <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'top'] }>
                    <View style={ styles.loadingBody }>
                        <Loading fullScreen={ false } />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={ styles.container }>
            <CalendarBackdrop />
            <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'top'] }>
                <TherapyCalendar
                    sessions={ scheduleSessions }
                    reminders={ reminders }
                    activeDateKey={ activeDateKey }
                    onDayPress={ handleDayPress }
                />

                <View style={ styles.sheet }>
                    { /* A lit edge along the sheet's lip, brightest in the
                         middle, which is what separates it from the month
                         above without drawing a hard rule. */ }
                    <LinearGradient
                        colors={ ['rgba(255,255,255,0)', theme.surface.cardHighlight, 'rgba(255,255,255,0)'] }
                        start={ { x: 0, y: 0 } }
                        end={ { x: 1, y: 0 } }
                        pointerEvents="none"
                        style={ styles.sheetHighlight }
                    />
                    <MaskedView
                        style={ styles.eventScroll }
                        maskElement={
                            <LinearGradient
                                colors={ ['#000000', '#000000', 'transparent'] }
                                locations={ [0, 0.9, 1] }
                                style={ StyleSheet.absoluteFillObject }
                            />
                        }
                    >
                        <ScrollView
                            contentContainerStyle={ [styles.eventCards, { paddingBottom: insets.bottom + 24 }] }
                            showsVerticalScrollIndicator={ false }
                            style={ styles.eventScroll }
                        >
                            <NextEventCard
                                label={ t('nextSession') }
                                date={ nextSession ? new Date(nextSession.startsAtUtc) : null }
                                detail={ nextSession?.seriesId ? t('schedule.everyWeek') : null }
                                accent={ theme.calendar.month.sessionDot }
                            />
                            <NextEventCard
                                label={ t('nextReminder') }
                                date={ nextReminder ? new Date(nextReminder.dueAtUtc) : null }
                                detail={ nextReminder ? reminderHeadline(nextReminder, t) : null }
                                accent={ theme.calendar.month.reminderDot }
                            />
                        </ScrollView>
                    </MaskedView>
                </View>
            </SafeAreaView>
            { sheet?.kind === 'schedule' && (
                <ScheduleModal
                    visible
                    selectedDate={ sheet.dateKey }
                    existingSession={ sheetSession }
                    defaultTime={ DEFAULT_TIME }
                    busy={ busy }
                    onAdd={ handleAdd }
                    onUpdate={ handleUpdate }
                    onDelete={ handleDelete }
                    onCancel={ closeSheet }
                />
            ) }
            { sheet?.kind === 'reminder' && (
                <ReminderSheet
                    visible
                    selectedDate={ sheet.dateKey }
                    reminders={ remindersByDay.get(sheet.dateKey) ?? [] }
                    sessions={ scheduleSessions }
                    onAddSession={ sheet.dateKey >= formatDateKey(new Date()) && !activeSession
                        ? () => setSheet({ kind: 'schedule', dateKey: sheet.dateKey })
                        : undefined }
                    onClose={ closeSheet }
                />
            ) }
            { sessionsError && (
                <ErrorModal
                    visible={ errorModalVisible }
                    title={ sessionsError.title }
                    message={ sessionsError.message }
                    buttonLabel={ sessionsError.retryable ? sessionsError.actionLabel : undefined }
                    onPress={ sessionsError.retryable ? handleErrorPrimaryAction : undefined }
                    onClose={ handleErrorModalClose }
                />
            ) }
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    root: {
        flex: 1,
    },
    loadingBody: {
        flex: 1,
        justifyContent: 'center',
    },
    // Runs to the bottom of the screen and under the tab bar, so only the top
    // corners are rounded.
    sheet: {
        flex: 1,
        backgroundColor: theme.ground.base,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    sheetHighlight: {
        height: 1.5,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1,
    },
    eventScroll: {
        flex: 1,
    },
    eventCards: {
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    eventCard: {
        width: '100%',
    },
    eventCardBody: {
        paddingBottom: 13,
        paddingTop: 13,
    },
    eventAside: {
        alignItems: 'flex-end',
        flexShrink: 1,
        marginLeft: 12,
    },
    eventLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 6,
    },
    eventDot: {
        borderRadius: 3,
        height: 6,
        marginLeft: 8,
        width: 6,
    },
    eventLabel: {
        color: theme.ink.secondary,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 1.2,
        textAlign: 'right',
        textTransform: 'uppercase',
    },
    eventValueRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 34,
    },
    // The month hangs off the top of the day number, where a temperature's
    // unit sits.
    eventReading: {
        alignItems: 'baseline',
        flexDirection: 'row',
    },
    eventDay: {
        color: theme.ink.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 34,
    },
    eventMonth: {
        color: theme.ink.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 34,
        marginLeft: 7,
    },
    eventDetail: {
        color: theme.ink.secondary,
        fontSize: 13,
        marginBottom: 2,
        textAlign: 'right',
    },
    eventMeta: {
        color: theme.ink.tertiary,
        fontSize: 13,
        textAlign: 'right',
    },
    eventEmpty: {
        alignSelf: 'center',
        color: theme.ink.tertiary,
        fontSize: 16,
        marginBottom: 4,
    },
});
