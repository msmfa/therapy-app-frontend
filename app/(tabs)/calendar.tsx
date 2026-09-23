import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import TherapyCalendar, { createDateFromKey, formatDateKey, type CalendarFocus } from '../../src/components/therapy-calendar/TherapyCalendar';
import ScheduleModal, { type ScheduleMode, type SheetSession } from '../../src/components/therapy-calendar/ScheduleModal';
import ReminderSheet from '../../src/components/therapy-calendar/ReminderSheet';
import { PassCard } from '../../src/components/therapy-calendar/PassCard';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import type { CalendarReminder, SessionEditScope, TherapySession } from '../../src/api/therapy';
import { ApiError } from '../../src/api/client';
import { updateCurrentUser } from '../../src/api/users';
import type { ReminderSlot } from '../../src/components/therapy-calendar/ReminderTimeSheet';
import { PresentedModal } from '../../src/components/ui/PresentedModal';
import ErrorModal from '../../src/components/ui/ErrorModal';
import { CalendarBackdrop } from '../../src/components/ui/CalendarBackdrop';
import { useAppAlert } from '../../src/context/alert';
import Loading from 'src/components/ui/Loading';
import AppText from 'src/components/ui/AppText';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../src/context/theme';
import { serverErrorMessage } from '../../src/features/errors/serverErrorMessage';
import { DEFAULT_SESSION_MINUTES } from '../../src/features/reminders/reminderScheduleConfig';

const DEFAULT_TIME = new Date(2024, 0, 1, 9, 0, 0);
/** The tab bar's height as `(tabs)/_layout` sets it, for when no navigator reports it. */
const TAB_BAR_HEIGHT = 76;
/** How far above the tab bar the fade starts. */
const BOTTOM_FADE_HEIGHT = 40;

type NextEventCardProps = {
    label: string;
    date: Date | null;
    /** Matches the dots the month uses for this kind of day. */
    accent: string;
    /** Given only when there is an event to open; the empty card is inert. */
    onPress?: () => void;
    /** The line along the foot of the card, saying what pressing it does. */
    footnote?: string | null;
    testID?: string;
};

// Reads like a boarding pass. The upper half is the reading: the day number
// carrying the card the way a temperature does, the month up against it as
// the unit, and a quiet label with a coloured dot on the shoulder. A hard
// break then cuts off a lighter band along the foot, which says what
// pressing the card does, the way a pass keeps its fine print below the tear.
const NextEventCard = React.memo(function NextEventCard({ label, date, accent, onPress, footnote, testID }: NextEventCardProps) {
    const { t } = useTranslation('calendar');
    const styles = useThemedStyles(makeStyles);
    const when = date ? dayjs(date) : null;

    return (
        <TouchableOpacity
            accessibilityRole={ onPress ? 'button' : undefined }
            activeOpacity={ 0.85 }
            disabled={ !onPress }
            onPress={ onPress }
            testID={ testID }
        >
            <PassCard
                footer={ when && footnote
                    ? <AppText variant="caption" style={ styles.eventFootnote }>{ footnote }</AppText>
                    : null }
            >
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
                        { when ? (
                            <AppText variant="caption" style={ styles.eventMeta }>{ when.format('ddd, LT') }</AppText>
                        ) : null }
                    </View>
                </View>
            </PassCard>
        </TouchableOpacity>
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
        reminderScheduleSettings, refreshReminderSchedule,
    } = useTherapySessions();
    // Read from the context rather than the hook, which throws outside the
    // tab navigator (the screen tests render it bare).
    const tabBarHeight = useContext(BottomTabBarHeightContext) ?? TAB_BAR_HEIGHT;
    const { showAlert } = useAppAlert();
    const [sheet, setSheet] = useState<OpenSheet>(null);
    const [focus, setFocus] = useState<CalendarFocus | null>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);

    const canScrollDown = contentHeight - viewportHeight - scrollOffset > 2;
    const [busy, setBusy] = useState(false);
    const writing = useRef(false);
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

    const focusDay = useCallback((dateKey: string) => {
        setFocus((previous) => ({ dateKey, seq: (previous?.seq ?? 0) + 1 }));
    }, []);

    // Every edit belongs to the day it is on, so the card does not grow a
    // second, quieter way to move a session. It takes the month to the day
    // and says where to tap, which leaves the editing where the rest of the
    // screen keeps it.
    const handleNextSessionPress = useCallback(() => {
        if (!nextSession) return;
        const startsAt = new Date(nextSession.startsAtUtc);
        if (Number.isNaN(startsAt.getTime())) return;
        focusDay(formatDateKey(startsAt));
    }, [nextSession, focusDay]);

    // The card used to print the reminder's headline. The sheet says the same
    // thing and then some, so the card opens it instead of paraphrasing it,
    // over the month the reminder actually falls in.
    const handleNextReminderPress = useCallback(() => {
        if (!nextReminder) return;
        focusDay(nextReminder.localDate);
        setSheet({ kind: 'reminder', dateKey: nextReminder.localDate });
    }, [nextReminder, focusDay]);

    const closeSheet = useCallback(() => setSheet(null), []);

    // Leaving the tab closes whatever was open; the sheet belongs to the visit.
    useFocusEffect(useCallback(() => () => {
        setSheet(null);
    }, []));

    const reportFailure = useCallback((err: unknown) => {
        if (err instanceof ApiError && err.status === 412) {
            showAlert(t('changedTitle'), t('changedMessage'));
        } else if (err instanceof ApiError && err.code === 'appointment_day_conflict') {
            showAlert(t('schedule.dayTakenTitle'), t('schedule.dayTaken'));
        } else {
            showAlert(tCommon('error.title'), serverErrorMessage(err, t('saveFailed')));
        }
    }, [showAlert, t, tCommon]);

    // `keepSheetOpen` is for a write that changes what the open sheet is
    // showing rather than finishing with it: the new reminder time should
    // appear on the card that was just edited, not vanish with it.
    //
    // A failed write always closes the sheet, whatever it asked for. What
    // went wrong is said through the app alert, the alert is a modal, and a
    // modal cannot be presented over the sheet: the message would be thrown
    // away and the sheet would sit there having visibly done nothing. The
    // alert waits for the sheet to go (see `modalPresence`), so the sheet
    // has to go.
    const run = useCallback(async (write: () => Promise<unknown>, keepSheetOpen = false) => {
        if (writing.current) return;
        writing.current = true;
        setBusy(true);
        try {
            await write();
            if (!keepSheetOpen) setSheet(null);
        } catch (err) {
            console.error('calendar write failed', err);
            setErrorDismissed(true);
            setErrorModalVisible(false);
            setSheet(null);
            reportFailure(err);
        } finally {
            writing.current = false;
            setBusy(false);
        }
    }, [reportFailure]);

    // The two wall-clock times behind every review reminder. They belong to
    // the account rather than to a day, which is why the picker that edits
    // them says so out loud.
    const slotMinutes = useMemo(() => (reminderScheduleSettings
        ? {
            morning: reminderScheduleSettings.morningReminderMinutes,
            evening: reminderScheduleSettings.eveningReminderMinutes,
        }
        : null), [reminderScheduleSettings]);

    const handleSaveSlotTime = useCallback((slot: ReminderSlot, minutes: number) => {
        return run(async () => {
            await updateCurrentUser(slot === 'morning'
                ? { morningReminderMinutes: minutes }
                : { eveningReminderMinutes: minutes });
            // The times moved without the sessions moving, so the cached
            // schedule is stale in a way a session write would not make it.
            await refreshReminderSchedule();
        }, true);
    }, [run, refreshReminderSchedule]);

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

    // Ending a series removes every later appointment in one go, which is the
    // one edit on this screen that cannot be undone by tapping again. The
    // sheet asks before it calls this: the question used to go through the
    // app-wide alert, which is a modal of its own, and iOS silently refuses
    // to present one modal over another, so the button did nothing at all.
    const handleDelete = useCallback((scope: SessionEditScope) => {
        if (!sheetSession) return;
        void run(() => removeSession(sheetSession.id, scope));
    }, [sheetSession, removeSession, run]);

    useEffect(() => {
        if (sessionsError && !errorDismissed && !busy && !sheet) setErrorModalVisible(true);
        if (!sessionsError) {
            setErrorModalVisible(false);
            setErrorDismissed(false);
        }
    }, [sessionsError, errorDismissed, busy, sheet]);

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
        return <Loading fullScreen />;
    }

    return (
        <View style={ styles.container }>
            <CalendarBackdrop />
            <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'top'] }>
                <ScrollView
                    testID="calendar.scroll"
                    contentContainerStyle={ { flexGrow: 1 } }
                    showsVerticalScrollIndicator={ false }
                    onLayout={ (event) => setViewportHeight(event.nativeEvent.layout.height) }
                    onContentSizeChange={ (_width, height) => setContentHeight(height) }
                    onScroll={ (event) => setScrollOffset(event.nativeEvent.contentOffset.y) }
                    scrollEventThrottle={ 16 }
                >
                <TherapyCalendar
                    sessions={ scheduleSessions }
                    reminders={ reminders }
                    activeDateKey={ activeDateKey }
                    focus={ focus }
                    onDayPress={ handleDayPress }
                />

                <View style={ styles.sheet }>
                    <LinearGradient
                        colors={ theme.calendar.eventCard.ground }
                        pointerEvents="none"
                        style={ StyleSheet.absoluteFill }
                    />
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
                    <View style={ [styles.eventCards, { paddingBottom: tabBarHeight + BOTTOM_FADE_HEIGHT }] }>
                            <NextEventCard
                                label={ t('nextSession') }
                                date={ nextSession ? new Date(nextSession.startsAtUtc) : null }
                                accent={ theme.calendar.month.sessionDot }
                                onPress={ nextSession ? handleNextSessionPress : undefined }
                                footnote={ t('nextSessionHelp.message') }
                                testID="calendar.nextSession"
                            />
                            <NextEventCard
                                label={ t('nextReminder') }
                                date={ nextReminder ? new Date(nextReminder.dueAtUtc) : null }
                                accent={ theme.calendar.month.reminderDot }
                                onPress={ nextReminder ? handleNextReminderPress : undefined }
                                footnote={ t('nextReminderHelp') }
                                testID="calendar.nextReminder"
                            />
                    </View>
                </View>
                </ScrollView>
                { /* The tab bar floats over the sheet with no ground of its
                     own, so a card that runs on under it is faded out from a
                     little above the icons down, into the colour the sheet's
                     gradient ends on. */ }
                { canScrollDown && (
                    <LinearGradient
                        testID="calendar.bottomFade"
                        pointerEvents="none"
                        colors={ [theme.calendar.eventCard.groundFade, theme.calendar.eventCard.ground[theme.calendar.eventCard.ground.length - 1]] }
                        locations={ [0, 0.55] }
                        style={ [styles.bottomFade, { height: tabBarHeight + BOTTOM_FADE_HEIGHT }] }
                    />
                ) }
            </SafeAreaView>
            <PresentedModal visible={ Boolean(sheet) } transparent animationType="slide" onRequestClose={ () => { if (!busy) closeSheet(); } }>
            { sheet?.kind === 'schedule' && (
                <ScheduleModal
                    embedded
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
                    embedded
                    visible
                    selectedDate={ sheet.dateKey }
                    reminders={ remindersByDay.get(sheet.dateKey) ?? [] }
                    sessions={ scheduleSessions }
                    slotMinutes={ slotMinutes }
                    onSaveSlotTime={ handleSaveSlotTime }
                    busy={ busy }
                    onAddSession={ sheet.dateKey >= formatDateKey(new Date()) && !activeSession
                        ? () => setSheet({ kind: 'schedule', dateKey: sheet.dateKey })
                        : undefined }
                    onClose={ closeSheet }
                />
            ) }
            </PresentedModal>
            { sessionsError && (
                <ErrorModal
                    visible={ errorModalVisible && !sheet && !busy }
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
    // Runs to the bottom of the screen and under the tab bar, so only the top
    // corners are rounded.
    sheet: {
        flex: 1,
        backgroundColor: theme.ground.base,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    bottomFade: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
    },
    sheetHighlight: {
        height: 1.5,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1,
    },
    eventCards: {
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    eventAside: {
        alignItems: 'flex-end',
        flexShrink: 1,
        marginLeft: 12,
    },
    eventLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 1,
    },
    eventDot: {
        borderRadius: 3,
        height: 6,
        marginLeft: 8,
        width: 6,
    },
    eventLabel: {
        color: theme.ink.primary,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 1.2,
        lineHeight: 15,
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
    eventMeta: {
        color: theme.ink.secondary,
        fontSize: 13,
        lineHeight: 16,
        textAlign: 'right',
    },
    // In the foot band, a step below the reading: the card is a readout
    // first, and this says what happens if you press it.
    eventFootnote: {
        color: theme.ink.secondary,
        fontSize: 13,
        lineHeight: 17,
    },
    eventEmpty: {
        alignSelf: 'center',
        color: theme.ink.tertiary,
        fontSize: 16,
        marginBottom: 4,
    },
});
