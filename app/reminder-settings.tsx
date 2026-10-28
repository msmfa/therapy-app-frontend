import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { updateCurrentUser } from '../src/api/users';
import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import AppText from '../src/components/ui/AppText';
import { Button } from '../src/components/ui/Button';
import { ErrorMessage } from '../src/components/ui/ErrorMessage';
import FrostedCard from '../src/components/ui/FrostedCard';
import Loading from '../src/components/ui/Loading';
import { useAppAlert } from '../src/context/alert';
import { useTherapySessions } from '../src/context/therapy-sessions/TherapySessionsContext';
import { readNotificationPermission, requestNotificationPermission } from '../src/features/onboarding/onboardingNotifications';
import { ensurePushRegistration } from '../src/services/notifications/pushRegistration';
import { dateToMinutes, minutesToDate, timeLabel } from '../src/features/onboarding/formatting';
import { TIME_PICKER_BOUNDS } from '../src/utils/timePickerBounds';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../src/context/theme';
import { GlassPickerPanel } from '../src/components/ui/GlassPickerPanel';
import { DottedDivider } from '../src/components/ui/DottedDivider';
import { formattingLocale } from '../src/i18n';

type Slot = 'morning' | 'evening';
type NotificationStatus = 'checking' | 'on' | 'off';

export default function ReminderSettingsScreen() {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const router = useRouter();
    const { showAlert } = useAppAlert();
    const { t } = useTranslation('reminderSettings');
    const { t: tCommon } = useTranslation('common');
    const { reminderScheduleSettings, refreshSessions, refreshReminderSchedule } = useTherapySessions();
    const [loadFailed, setLoadFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    // Only the times picked here. The rest show what the server sends at,
    // which the calendar reports with its defaults already filled in, and
    // Save sends nothing for a time the user did not touch.
    const [draft, setDraft] = useState<Partial<Record<Slot, number>>>({});
    const [androidSlot, setAndroidSlot] = useState<Slot | null>(null);
    const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('checking');

    const refreshPermission = useCallback(async () => {
        try {
            const permission = await readNotificationPermission();
            setNotificationStatus(permission.granted ? 'on' : 'off');
        } catch {
            setNotificationStatus('off');
        }
    }, []);

    useEffect(() => {
        let live = true;
        refreshSessions().catch(() => {
            if (live) setLoadFailed(true);
        });
        return () => { live = false; };
    }, [refreshSessions, attempt]);

    const retry = useCallback(() => {
        setLoadFailed(false);
        setAttempt((current) => current + 1);
    }, []);

    useEffect(() => {
        void refreshPermission();
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void refreshPermission();
        });
        return () => subscription.remove();
    }, [refreshPermission]);

    const morningMinutes = draft.morning ?? reminderScheduleSettings?.morningReminderMinutes;
    const eveningMinutes = draft.evening ?? reminderScheduleSettings?.eveningReminderMinutes;

    const enableNotifications = useCallback(async () => {
        try {
            let permission = await readNotificationPermission();
            if (!permission.granted && permission.canAskAgain) {
                permission = await requestNotificationPermission({ entryPoint: 'settings' });
            } else if (!permission.granted || notificationStatus === 'on') {
                await Linking.openSettings();
                return;
            }
            setNotificationStatus(permission.granted ? 'on' : 'off');
            if (permission.granted) {
                const registration = await ensurePushRegistration({ entryPoint: 'settings' });
                if (registration.status === 'failed') {
                    showAlert(t('enableFailed'), t('enableFailedMessage'));
                }
            }
        } catch {
            showAlert(t('permissionFailed'), tCommon('error.tryAgain'));
        }
    }, [notificationStatus, showAlert, t, tCommon]);

    const change = useCallback(
        (slot: Slot) => (event: DateTimePickerEvent, picked?: Date) => {
            setAndroidSlot(null);
            // A dismissed picker reports the value it was already showing, not
            // a choice; writing it back overwrites the pick just made.
            if (event.type === 'dismissed') return;
            if (!picked || !Number.isFinite(picked.getTime())) return;

            const value = dateToMinutes(picked);
            setDraft((current) => ({ ...current, [slot]: value }));
        },
        [],
    );

    const save = useCallback(async () => {
        if (saving || (draft.morning === undefined && draft.evening === undefined)) return;

        setSaving(true);
        try {
            await updateCurrentUser({
                ...(draft.morning === undefined ? {} : { morningReminderMinutes: draft.morning }),
                ...(draft.evening === undefined ? {} : { eveningReminderMinutes: draft.evening }),
            });
            // The calendar caches the server-computed reminder instants. Times
            // changed without sessions changing, so invalidate that cache
            // explicitly and let it fetch the updated schedule.
            await refreshReminderSchedule();
            setDraft({});
            showAlert(t('saved'), t('savedMessage'));
        } catch {
            showAlert(t('saveFailed'), tCommon('error.tryAgain'));
        } finally {
            setSaving(false);
        }
    }, [draft, refreshReminderSchedule, saving, showAlert, t, tCommon]);

    if (morningMinutes === undefined || eveningMinutes === undefined) {
        if (!loadFailed) return <Loading fullScreen />;
        return (
            <SettingsPageShell title={ t('title') } onBack={ () => router.back() }>
                <FrostedCard contentStyle={ styles.card }>
                    <ErrorMessage message={ t('loadFailed') } />
                    <Button label={ tCommon('action.tryAgain') } onPress={ retry } addedStyles={ styles.save } />
                </FrostedCard>
            </SettingsPageShell>
        );
    }

    const rows: { slot: Slot; label: string; minutes: number }[] = [
        {
            slot: 'morning',
            label: t('morning'),
            minutes: morningMinutes,
        },
        {
            slot: 'evening',
            label: t('evening'),
            minutes: eveningMinutes,
        },
    ];

    return (
        <SettingsPageShell title={ t('title') } onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <AppText variant="body" style={ styles.intro }>
                    { t('intro') }
                </AppText>

                <View style={ styles.timeRows }>
                    { rows.map((row, index) => {
                        const value = minutesToDate(row.minutes);
                        return (
                            <View key={ row.slot }>
                                { index > 0 && <DottedDivider style={ styles.divider } /> }
                                <View style={ styles.timeRow }>
                                    <View style={ styles.timeCopy }>
                                        <AppText variant="h3" style={ styles.label }>
                                            { row.label }
                                        </AppText>
                                    </View>
                                    { /* Apple's compact control, left as it
                                         comes: see reminder-times. */ }
                                    { Platform.OS === 'ios' ? (
                                        <DateTimePicker
                                            { ...TIME_PICKER_BOUNDS }
                                            accentColor={ theme.accent.mark }
                                            value={ value }
                                            mode="time"
                                            display="compact"
                                            themeVariant={ theme.scheme }
                                            // Apple's control reads the device
                                            // locale by default, which would
                                            // show an AM/PM dial next to French
                                            // copy on an English phone.
                                            locale={ formattingLocale() }
                                            accessibilityLabel={ t('a11yTime', { label: row.label, time: timeLabel(value) }) }
                                            onChange={ change(row.slot) }
                                        />
                                    ) : (
                                        <Button
                                            label={ timeLabel(value) }
                                            transparent
                                            onPress={ () => setAndroidSlot(row.slot) }
                                        />
                                    ) }
                                </View>
                            </View>
                        );
                    }) }
                </View>

                <View style={ styles.notificationSection }>
                    <SettingsRow
                        text={ t('permissions', {
                            state: notificationStatus === 'on' ? t('permissionOn') : t('permissionOff'),
                        }) }
                        onPress={ () => { void enableNotifications(); } }
                    />
                </View>

                <Button
                    label={ t('save') }
                    disabled={ draft.morning === undefined && draft.evening === undefined }
                    loading={ saving }
                    onPress={ () => void save() }
                    addedStyles={ styles.save }
                />
            </FrostedCard>

            { androidSlot !== null && (
                <GlassPickerPanel style={ styles.androidPicker }>
                    <DateTimePicker
                        { ...TIME_PICKER_BOUNDS }
                        accentColor={ theme.accent.mark }
                        locale={ formattingLocale() }
                        value={ minutesToDate(
                            androidSlot === 'morning' ? morningMinutes : eveningMinutes,
                        ) }
                        mode="time"
                        display="default"
                        onChange={ change(androidSlot) }
                    />
                </GlassPickerPanel>
            ) }
        </SettingsPageShell>
    );
}

const TIME_ROWS_PADDING = 14;

const makeStyles = (theme: Theme) => StyleSheet.create({
    androidPicker: {
        marginTop: 16,
    },
    card: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    intro: {
        color: theme.ink.secondary,
    },
    timeRows: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: TIME_ROWS_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.surface.rowGroupBorder,
        backgroundColor: theme.surface.rowGroup,
    },
    divider: {
        marginHorizontal: -TIME_ROWS_PADDING,
    },
    timeRow: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    timeCopy: {
        flex: 1,
    },
    label: {
        fontSize: 17,
    },
    notificationSection: {
        marginBottom: 18,
    },
    // The settings rows stacked above it stand 64pt tall. The button's own
    // 44pt minimum left it noticeably shallower than everything it sits
    // under, which read as a smaller, lesser control rather than the one that
    // commits the page.
    save: {
        minHeight: 64,
    },
});
