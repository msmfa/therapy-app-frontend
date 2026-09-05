import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import {
    NOTIFICATIONS_COPY,
    notificationsHeadline,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { postSessionNoteAt } from '../../src/features/onboarding/planTimeline';
import { timeLabel, weekdayName } from '../../src/features/onboarding/formatting';
import { setPendingOnboardingStep } from '../../src/features/onboarding/authReturn';
import {
    cancelOnboardingReminder,
    readNotificationPermission,
    requestNotificationPermission,
} from '../../src/features/onboarding/onboardingNotifications';
import { ensurePushRegistration } from '../../src/services/notifications/pushRegistration';
import { useAppAlert } from '../../src/context/alert';
import { TEXT_COLORS } from 'designs/designs-colors';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';

type PermissionStage = 'checking' | 'askable' | 'blocked' | 'requesting';

export default function NotificationsPreviewScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();
    const { showAlert } = useAppAlert();
    const [stage, setStage] = useState<PermissionStage>('checking');
    const enableInFlightRef = useRef(false);

    const entitled = answers.entitlementConfirmedThisSession;

    const firstReminderAt = useMemo(() => {
        return answers.sessionAt === null ? null : postSessionNoteAt(answers.sessionAt);
    }, [answers.sessionAt]);

    // Reaching this screen ends the account step's handoff.
    useEffect(() => {
        setPendingOnboardingStep(null);
    }, []);

    // Reads the current permission without asking for it. The system prompt is
    // only ever raised by the user tapping "Turn on notifications".
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const syncPermission = useCallback(async () => {
        try {
            const { granted, canAskAgain } = await readNotificationPermission();
            if (!mountedRef.current) return;
            setStage(granted || canAskAgain ? 'askable' : 'blocked');
        } catch {
            if (mountedRef.current) setStage('askable');
        }
    }, []);

    useEffect(() => {
        if (!entitled || firstReminderAt === null) return;
        void syncPermission();
    }, [entitled, firstReminderAt, syncPermission]);

    // Someone sent to Settings to switch notifications on comes back to a screen
    // that still says they are off. One listener, removed on unmount, so
    // repeated visits cannot stack them up.
    useEffect(() => {
        if (!entitled || firstReminderAt === null) return;

        const subscription = AppState.addEventListener('change', (next) => {
            if (next === 'active') void syncPermission();
        });

        return () => subscription.remove();
    }, [entitled, firstReminderAt, syncPermission]);

    const handleEnable = useCallback(async () => {
        if (enableInFlightRef.current || firstReminderAt === null) return;
        enableInFlightRef.current = true;
        setStage('requesting');

        const { granted, canAskAgain } = await requestNotificationPermission().catch(() => ({
            granted: false,
            canAskAgain: false,
        }));

        // Permission by itself is not delivery. Register the Expo token with
        // the backend now, in the same action, so the reminder cron can reach
        // this device without requiring a relaunch. Older builds scheduled a
        // duplicate local copy of the first push; remove any one they left.
        await cancelOnboardingReminder().catch(() => undefined);
        const outcome = granted
            ? await ensurePushRegistration()
            : ({ status: 'permission_denied' } as const);

        if (!mountedRef.current) {
            enableInFlightRef.current = false;
            return;
        }

        const registered = outcome.status === 'registered';
        setAnswer('reminderScheduled', registered && firstReminderAt.getTime() > Date.now());
        enableInFlightRef.current = false;

        if (!granted) {
            // A system-level denial needs an explicit route back to Settings.
            // Advancing straight to Success hid that recovery action as soon as
            // the user had denied the prompt.
            setStage(canAskAgain ? 'askable' : 'blocked');
            return;
        }

        if (!registered) {
            // Permission alone cannot deliver anything. Keep the user here so a
            // temporary token/backend failure can be retried instead of showing
            // a success screen that says reminders are off.
            setStage('askable');
            showAlert(
                NOTIFICATIONS_COPY.registrationErrorTitle,
                NOTIFICATIONS_COPY.registrationErrorBody,
            );
            return;
        }

        router.push('/(onboarding)/success');
    }, [firstReminderAt, router, setAnswer, showAlert]);

    const handleSkip = useCallback(() => {
        setAnswer('reminderScheduled', false);
        void cancelOnboardingReminder();
        router.push('/(onboarding)/success');
    }, [router, setAnswer]);

    // Reminders are part of the paid plan, so this step only exists once
    // StoreKit confirmed a purchase or restore. After every hook, so a state
    // change can never alter this component's hook order.
    if (!entitled) {
        return <Redirect href="/(onboarding)/subscription-preview" />;
    }

    // A permission prompt has no contextual value until there is a real
    // session to schedule around. The sample-plan path moves on without asking;
    // Calendar is where the user adds the booking after setup.
    if (firstReminderAt === null) {
        return <Redirect href="/(onboarding)/success" />;
    }

    if (stage === 'blocked') {
        return (
            <OnboardingScreen
                showBack={ false }
                headline={ NOTIFICATIONS_COPY.deniedHeadline }
                supporting={ NOTIFICATIONS_COPY.deniedBody }
                footer={
                    <>
                        <OnboardingButton
                            label={ NOTIFICATIONS_COPY.deniedPrimaryCta }
                            onPress={ () => {
                                void Linking.openSettings();
                            } }
                        />
                        <OnboardingButton
                            label={ NOTIFICATIONS_COPY.secondaryCta }
                            transparent
                            onPress={ handleSkip }
                        />
                    </>
                }
            />
        );
    }

    return (
        <OnboardingScreen
            showBack={ false }
            headline={ notificationsHeadline(
                weekdayName(firstReminderAt),
                timeLabel(firstReminderAt),
            ) }
            supporting={ NOTIFICATIONS_COPY.body }
            footer={
                <>
                    <OnboardingButton
                        label={ NOTIFICATIONS_COPY.primaryCta }
                        loading={ stage === 'requesting' }
                        onPress={ () => void handleEnable() }
                    />
                    <OnboardingButton
                        label={ NOTIFICATIONS_COPY.secondaryCta }
                        transparent
                        disabled={ stage === 'requesting' }
                        onPress={ handleSkip }
                    />
                </>
            }
        >
            <View style={ [onboardingStyles.card, styles.privacy] }>
                <Feather name="lock" size={ 18 } color={ TEXT_COLORS.secondary } />
                <AppText variant="body" style={ styles.privacyText }>
                    { NOTIFICATIONS_COPY.privacy }
                </AppText>
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    privacy: {
        padding: 20,
        marginTop: 24,
        flexDirection: 'row',
        gap: 12,
    },
    privacyText: {
        flex: 1,
        color: TEXT_COLORS.secondary,
    },
});
