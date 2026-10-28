import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../src/api/client';
import { updateCurrentUser } from '../src/api/users';
import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import AppText from '../src/components/ui/AppText';
import { Button } from '../src/components/ui/Button';
import { Dropdown } from '../src/components/ui/Dropdown';
import FrostedCard from '../src/components/ui/FrostedCard';
import { GlassPickerPanel } from '../src/components/ui/GlassPickerPanel';
import Loading from '../src/components/ui/Loading';
import { ClearFutureConfirm } from '../src/components/schedule/ClearFutureConfirm';
import {
    SchedulePickerRows,
    type SchedulePickerRow,
    type ScheduleSlot,
} from '../src/components/schedule/SchedulePickerRows';
import { useAppAlert } from '../src/context/alert';
import { useTherapySessions } from '../src/context/therapy-sessions/TherapySessionsContext';
import {
    DEFAULT_EVENING_MINUTES,
    DEFAULT_MORNING_MINUTES,
} from '../src/features/onboarding/OnboardingAnswersContext';
import {
    cadenceCopy,
    cadenceOptions,
    reminderTimesCopy,
    sessionDateCopy,
    type CadenceId,
} from '../src/features/onboarding/onboardingCopy';
import { dateToMinutes, minutesToDate } from '../src/features/onboarding/formatting';
import { serverErrorMessage } from '../src/features/errors/serverErrorMessage';
import { DEFAULT_SESSION_MINUTES } from '../src/features/reminders/reminderScheduleConfig';
import { TIME_PICKER_BOUNDS } from '../src/utils/timePickerBounds';
import { isWithinFirstSessionWindow, latestFirstSessionAt } from '../src/utils/sessionWindow';
import { formattingLocale } from '../src/i18n';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../src/context/theme';

/** Where the pickers start when there is no future session to edit. */
const pickerSeed = (): Date => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(17, 0, 0, 0);
    return next;
};

/**
 * The onboarding schedule answers, reopened as a settings page laid out like
 * reminder settings: the next session, how often, and reminder times, in one
 * frosted card with Apple's compact pickers.
 *
 * Save replaces the schedule from now on only when the session, its time or
 * how often changed, so a reminder-time edit does not reset sessions moved by
 * hand (docs/plans/session-schedule-settings.md).
 */
export default function SessionScheduleScreen() {
    const router = useRouter();
    const { t } = useTranslation('calendar');
    const { hydrated, refreshSessions } = useTherapySessions();
    const [fetched, setFetched] = useState(false);
    const [seed, setSeed] = useState(0);

    // The form seeds itself once from the calendar, so it waits for the
    // server's answer rather than the cached copy painted first. Latched: a
    // later refresh must not unmount the form mid-edit.
    useEffect(() => {
        let live = true;
        void (async () => {
            try {
                await refreshSessions();
            } catch {
                // The context has already reported it. The cached calendar
                // still seeds the form, and Save sends the revision it came
                // from, so a stale copy is refused rather than saved over.
            }
            if (live) setFetched(true);
        })();
        return () => { live = false; };
    }, [refreshSessions]);

    const reseed = useCallback(() => setSeed((current) => current + 1), []);

    return (
        <SettingsPageShell title={ t('schedule.settingsTitle') } onBack={ () => router.back() } closeIcon>
            { fetched && hydrated ? <ScheduleForm key={ seed } onCalendarChanged={ reseed } /> : <Loading /> }
        </SettingsPageShell>
    );
}

/** Seeds from the calendar on mount; `onCalendarChanged` asks for a fresh seed. */
function ScheduleForm({ onCalendarChanged }: { onCalendarChanged: () => void }) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const router = useRouter();
    const { t } = useTranslation('calendar');
    const { t: tCommon } = useTranslation('common');
    const { showAlert } = useAppAlert();
    const {
        revision,
        nextSession,
        series,
        reminderScheduleSettings,
        replaceSchedule,
        clearFutureSessions,
        refreshReminderSchedule,
    } = useTherapySessions();

    const [validationNow, setValidationNow] = useState(() => new Date());
    const latestAllowed = useMemo(() => latestFirstSessionAt(validationNow), [validationNow]);
    const [sessionAt, setSessionAt] = useState<Date>(() =>
        nextSession ? new Date(nextSession.startsAtUtc) : pickerSeed());
    const [cadence, setCadence] = useState<CadenceId | null>(() => {
        if (!nextSession) return null;
        return series.find((rule) => rule.id === nextSession.seriesId)?.cadence ?? 'varies';
    });
    const [minutes, setMinutes] = useState<Record<'morning' | 'evening', number>>(() => ({
        morning: reminderScheduleSettings?.morningReminderMinutes ?? DEFAULT_MORNING_MINUTES,
        evening: reminderScheduleSettings?.eveningReminderMinutes ?? DEFAULT_EVENING_MINUTES,
    }));
    const [androidSlot, setAndroidSlot] = useState<ScheduleSlot | null>(null);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    // What the server holds, as far as this page knows: the seed, then each
    // write that succeeded. A retry after a half-failed Save compares against
    // this, not against the values the page opened with.
    const [saved, setSaved] = useState(() => ({ revision, sessionAt, cadence, minutes }));

    const dateChanged = sessionAt.getTime() !== saved.sessionAt.getTime();
    const scheduleChanged = dateChanged || cadence !== saved.cadence;
    const timesChanged = minutes.morning !== saved.minutes.morning || minutes.evening !== saved.minutes.evening;
    const isFuture = sessionAt.getTime() > validationNow.getTime();
    // A newly chosen date keeps onboarding's six months. A session already
    // booked further out (the calendar allows a year) keeps its date while
    // only how often changes.
    const inRange = !dateChanged || isWithinFirstSessionWindow(sessionAt, validationNow);
    const sessionValid = !scheduleChanged || (isFuture && inRange);
    // Reminder times save on their own; only a schedule needs how often.
    const canSave = cadence !== null || (timesChanged && !scheduleChanged);
    const latestPickable = saved.sessionAt > latestAllowed ? saved.sessionAt : latestAllowed;

    // The calendar's own wording for a refused write, so this page and the
    // calendar say the same thing about the same failure.
    const reportFailure = useCallback((err: unknown) => {
        if (err instanceof ApiError && err.status === 412) {
            showAlert(t('changedTitle'), t('changedMessage'));
            // The calendar has been refreshed; show what it now holds.
            onCalendarChanged();
        } else if (err instanceof ApiError && err.code === 'appointment_day_conflict') {
            showAlert(t('schedule.dayTakenTitle'), t('schedule.dayTaken'));
        } else {
            showAlert(tCommon('error.title'), serverErrorMessage(err, t('saveFailed')));
        }
    }, [onCalendarChanged, showAlert, t, tCommon]);

    const save = useCallback(async () => {
        if (saving || clearing || !canSave) return;
        // Re-checked against the clock now: the time chosen may have passed
        // while the page was open.
        const now = new Date();
        setValidationNow(now);
        if (scheduleChanged && (sessionAt.getTime() <= now.getTime()
            || (dateChanged && !isWithinFirstSessionWindow(sessionAt, now)))) return;

        setSaving(true);
        try {
            // The schedule first: it is the write that can be refused, and a
            // refusal should leave the reminder times as they were too.
            if (scheduleChanged && cadence !== null) {
                const next = await replaceSchedule({
                    firstSessionAt: sessionAt,
                    cadence,
                    durationMin: nextSession?.durationMin ?? DEFAULT_SESSION_MINUTES,
                    revision: saved.revision,
                });
                setSaved((current) => ({ ...current, revision: next, sessionAt, cadence }));
            }
            if (timesChanged) {
                await updateCurrentUser({
                    morningReminderMinutes: minutes.morning,
                    eveningReminderMinutes: minutes.evening,
                });
                setSaved((current) => ({ ...current, minutes }));
                await refreshReminderSchedule();
            }
            router.back();
        } catch (err) {
            reportFailure(err);
        } finally {
            setSaving(false);
        }
    }, [
        cadence, canSave, clearing, dateChanged, minutes, nextSession, refreshReminderSchedule, replaceSchedule,
        reportFailure, router, saved.revision, saving, scheduleChanged, sessionAt, timesChanged,
    ]);

    const clear = useCallback(async () => {
        if (saving || clearing) return;
        setClearing(true);
        try {
            await clearFutureSessions();
            setConfirmingClear(false);
            router.back();
        } catch (err) {
            setConfirmingClear(false);
            reportFailure(err);
        } finally {
            setClearing(false);
        }
    }, [clearFutureSessions, clearing, reportFailure, router, saving]);

    const change = (slot: ScheduleSlot) => (event: DateTimePickerEvent, picked?: Date) => {
        setAndroidSlot(null);
        // A dismissed picker reports the value it was already showing, not
        // a choice; writing it back overwrites the pick just made.
        if (event.type === 'dismissed') return;
        if (!picked || !Number.isFinite(picked.getTime())) return;

        if (slot === 'morning' || slot === 'evening') {
            setMinutes((current) => ({ ...current, [slot]: dateToMinutes(picked) }));
            return;
        }
        setSessionAt((current) => {
            const next = new Date(current);
            if (slot === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
            else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
            return next;
        });
    };

    const sessionRows: SchedulePickerRow[] = [
        { slot: 'date', label: sessionDateCopy().dateLabel, mode: 'date', value: sessionAt, minimumDate: validationNow, maximumDate: latestPickable },
        { slot: 'time', label: sessionDateCopy().timeLabel, mode: 'time', value: sessionAt, ...TIME_PICKER_BOUNDS },
    ];
    const reminderCopy = reminderTimesCopy();
    const reminderRows: SchedulePickerRow[] = [
        { slot: 'morning', label: reminderCopy.morningLabel, mode: 'time', value: minutesToDate(minutes.morning), ...TIME_PICKER_BOUNDS },
        { slot: 'evening', label: reminderCopy.eveningLabel, mode: 'time', value: minutesToDate(minutes.evening), ...TIME_PICKER_BOUNDS },
    ];
    const androidRow = [...sessionRows, ...reminderRows].find((row) => row.slot === androidSlot);

    return (
        <>
            <ScrollView contentContainerStyle={ styles.content } showsVerticalScrollIndicator={ false }>
                <FrostedCard contentStyle={ styles.card }>
                    <SchedulePickerRows rows={ sessionRows } onChange={ change } onOpenAndroid={ setAndroidSlot } />
                    { /* Onboarding's own messages for the same two mistakes. */ }
                    { scheduleChanged && !isFuture && (
                        <AppText variant="body" style={ styles.validation } accessibilityLiveRegion="polite">
                            { sessionDateCopy().validation }
                        </AppText>
                    ) }
                    { scheduleChanged && isFuture && !inRange && (
                        <AppText variant="body" style={ styles.validation } accessibilityLiveRegion="polite">
                            { sessionDateCopy().rangeValidation }
                        </AppText>
                    ) }
                    <Dropdown
                        options={ cadenceOptions() }
                        value={ cadence }
                        placeholder={ cadenceCopy().headline }
                        onChange={ setCadence }
                        testID="session-schedule.cadence"
                    />
                    <SchedulePickerRows rows={ reminderRows } onChange={ change } onOpenAndroid={ setAndroidSlot } />

                    <SettingsRow
                        text={ t('schedule.clearFuture') }
                        onPress={ () => setConfirmingClear(true) }
                        disabled={ saving || clearing }
                    />

                    <Button
                        label={ t('schedule.save') }
                        disabled={ !canSave || !sessionValid || clearing }
                        loading={ saving }
                        onPress={ () => void save() }
                        addedStyles={ styles.save }
                    />
                </FrostedCard>

                { androidRow && (
                    <GlassPickerPanel style={ styles.androidPicker }>
                        <DateTimePicker
                            accentColor={ theme.accent.mark }
                            locale={ formattingLocale() }
                            value={ androidRow.value }
                            mode={ androidRow.mode }
                            display="default"
                            minimumDate={ androidRow.minimumDate }
                            maximumDate={ androidRow.maximumDate }
                            onChange={ change(androidRow.slot) }
                        />
                    </GlassPickerPanel>
                ) }
            </ScrollView>

            <ClearFutureConfirm
                visible={ confirmingClear }
                busy={ clearing }
                onCancel={ () => setConfirmingClear(false) }
                onConfirm={ () => void clear() }
            />
        </>
    );
}

// The reminder settings page's card, so the two pages match.
const makeStyles = (theme: Theme) => StyleSheet.create({
    content: {
        paddingBottom: 48,
    },
    card: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        gap: 20,
    },
    save: {
        minHeight: 64,
    },
    validation: {
        color: theme.status.error,
    },
    androidPicker: {
        marginTop: 16,
    },
});
