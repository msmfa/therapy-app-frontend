import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { getCurrentUserSettings, updateCurrentUser } from '../src/api/users';
import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import AppText from '../src/components/ui/AppText';
import { Button } from '../src/components/ui/Button';
import FrostedCard from '../src/components/ui/FrostedCard';
import Loading from '../src/components/ui/Loading';
import { useAppAlert } from '../src/context/alert';
import { useTherapySessions } from '../src/context/therapy-sessions/TherapySessionsContext';
import {
    DEFAULT_EVENING_MINUTES,
    DEFAULT_MORNING_MINUTES,
} from '../src/features/onboarding/OnboardingAnswersContext';
import { readNotificationPermission } from '../src/features/onboarding/onboardingNotifications';
import { dateToMinutes, minutesToDate, timeLabel } from '../src/features/onboarding/formatting';
import { COLOR_VARIANTS, PALETTE, TEXT_COLORS } from '../designs/designs-colors';

type Slot = 'morning' | 'evening';
type NotificationStatus = 'checking' | 'on' | 'off';

export default function ReminderSettingsScreen() {
    const router = useRouter();
    const { showAlert } = useAppAlert();
    const { refreshReminderSchedule } = useTherapySessions();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [morningMinutes, setMorningMinutes] = useState(DEFAULT_MORNING_MINUTES);
    const [eveningMinutes, setEveningMinutes] = useState(DEFAULT_EVENING_MINUTES);
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
        let cancelled = false;

        void Promise.all([
            getCurrentUserSettings(),
            readNotificationPermission().catch(() => ({ granted: false, canAskAgain: false })),
        ])
            .then(([settings, permission]) => {
                if (cancelled) return;
                setMorningMinutes(settings.morningReminderMinutes ?? DEFAULT_MORNING_MINUTES);
                setEveningMinutes(settings.eveningReminderMinutes ?? DEFAULT_EVENING_MINUTES);
                setNotificationStatus(permission.granted ? 'on' : 'off');
            })
            .catch(() => {
                if (cancelled) return;
                setNotificationStatus('off');
                showAlert("We couldn't load reminder settings", 'Please try again.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void refreshPermission();
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, [refreshPermission, showAlert]);

    const change = useCallback(
        (slot: Slot) => (_event: DateTimePickerEvent, picked?: Date) => {
            setAndroidSlot(null);
            if (!picked) return;

            const value = dateToMinutes(picked);
            if (slot === 'morning') setMorningMinutes(value);
            else setEveningMinutes(value);
        },
        [],
    );

    const save = useCallback(async () => {
        if (saving) return;

        setSaving(true);
        try {
            await updateCurrentUser({
                morningReminderMinutes: morningMinutes,
                eveningReminderMinutes: eveningMinutes,
            });
            // The calendar caches the server-computed reminder instants. Times
            // changed without sessions changing, so invalidate that cache
            // explicitly and let it fetch the updated schedule.
            await refreshReminderSchedule();
            showAlert('Reminder times updated', 'Your future reviews will use these times.');
        } catch {
            showAlert("We couldn't update reminder times", 'Please try again.');
        } finally {
            setSaving(false);
        }
    }, [eveningMinutes, morningMinutes, refreshReminderSchedule, saving, showAlert]);

    if (loading) {
        return <Loading fullScreen />;
    }

    const rows: { slot: Slot; label: string; hint: string; minutes: number }[] = [
        {
            slot: 'morning',
            label: 'Morning reviews',
            hint: "After a night's sleep",
            minutes: morningMinutes,
        },
        {
            slot: 'evening',
            label: 'Evening reviews',
            hint: 'For returning to a note later in the week',
            minutes: eveningMinutes,
        },
    ];

    return (
        <SettingsPageShell title="Reminder settings" onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <AppText variant="body" style={ styles.intro }>
                    Choose when short reviews fit your routine. Your note prompt still arrives
                    shortly after each therapy session.
                </AppText>

                <View style={ styles.timeRows }>
                    { rows.map((row, index) => {
                        const value = minutesToDate(row.minutes);
                        return (
                            <View key={ row.slot }>
                                { index > 0 && <View style={ styles.divider } /> }
                                <View style={ styles.timeRow }>
                                    <View style={ styles.timeCopy }>
                                        <AppText variant="h3" style={ styles.label }>
                                            { row.label }
                                        </AppText>
                                        <AppText variant="caption" style={ styles.hint }>
                                            { row.hint }
                                        </AppText>
                                    </View>
                                    { Platform.OS === 'ios' ? (
                                        <DateTimePicker
                                            value={ value }
                                            mode="time"
                                            display="compact"
                                            themeVariant="light"
                                            accessibilityLabel={ `${row.label}, ${timeLabel(value)}` }
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
                        text={ `Notification permissions: ${notificationStatus === 'on' ? 'On' : 'Off'}` }
                        onPress={ () => {
                            void Linking.openSettings().catch(() => {
                                showAlert(
                                    "We couldn't open Settings",
                                    'Open the Settings app to change notification access.',
                                );
                            });
                        } }
                    />
                </View>

                <Button label="Save reminder times" loading={ saving } onPress={ () => void save() } />
            </FrostedCard>

            { androidSlot !== null && (
                <DateTimePicker
                    value={ minutesToDate(
                        androidSlot === 'morning' ? morningMinutes : eveningMinutes,
                    ) }
                    mode="time"
                    display="default"
                    onChange={ change(androidSlot) }
                />
            ) }
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    intro: {
        color: TEXT_COLORS.secondary,
    },
    timeRows: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: COLOR_VARIANTS.white.secondary,
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
    hint: {
        marginTop: 2,
        color: TEXT_COLORS.tertiary,
    },
    divider: {
        height: 1,
        backgroundColor: COLOR_VARIANTS.white.tertiary,
    },
    notificationSection: {
        marginBottom: 18,
    },
});
