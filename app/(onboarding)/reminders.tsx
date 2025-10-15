import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import * as Notifications from 'expo-notifications';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import { ReminderRow } from '../../src/features/reminders/ReminderRow';
import { Button } from '../../src/components/ui/Button';
import { NEURO_REMINDER_COPY } from '../../src/constants/neuroReminders';
import AppText from '../../src/components/ui/AppText';
import ErrorModal from '../../src/components/ui/ErrorModal';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';

const LENGTH_OF_DAYS_TO_SHOW = 7;

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

export default function RemindersScreen(): JSX.Element | null {
    const router = useRouter();
    const {
        sessions,
        neuroReminders,
        error: sessionsError,
        refreshSessions,
    } = useTherapySessions();
    const [errorVisible, setErrorVisible] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (sessionsError) {
            setErrorVisible(true);
        } else {
            setErrorVisible(false);
        }
    }, [sessionsError]);

    const handleErrorClose = useCallback(() => {
        setErrorVisible(false);
    }, []);

    const handleErrorRetry = useCallback(() => {
        if (!sessionsError?.retryable) {
            setErrorVisible(false);
            return;
        }
        setErrorVisible(false);
        refreshSessions().catch(() => {});
    }, [sessionsError, refreshSessions]);

    const orderedSessionDates = useMemo(() => {
        return [...sessions]
            .sort(
                (a, b) =>
                    new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime(),
            )
            .map((session) => new Date(session.startsAtUtc))
            .filter((date) => !Number.isNaN(date.getTime()));
    }, [sessions]);

    const handleNext = useCallback(async () => {
        if (checkingPermission) {
            return;
        }

        setCheckingPermission(true);

        try {
            if (Platform.OS !== 'ios') {
                router.push('/(onboarding)/success');
                return;
            }

            const settings = await Notifications.getPermissionsAsync();
            if (settings.granted) {
                router.push('/(onboarding)/success');
                return;
            }

            router.push('/(onboarding)/notifications');
        } catch {
            router.push('/(onboarding)/notifications');
        } finally {
            if (isMountedRef.current) {
                setCheckingPermission(false);
            }
        }
    }, [checkingPermission, router]);

    const reminders = neuroReminders;

    const nextSessionDate = useMemo(() => {
        const now = Date.now();
        return orderedSessionDates.find((date) => date.getTime() >= now) ?? null;
    }, [orderedSessionDates]);

    const getRemindersForWeek = useMemo(() => {
        if (nextSessionDate) {
            const windowStart = dayjs(nextSessionDate);
            const windowEnd = windowStart.add(LENGTH_OF_DAYS_TO_SHOW, 'day');
            return reminders.filter(({ atUtc }) =>
                dayjs(atUtc).isBetween(windowStart, windowEnd, undefined, '[]'),
            );
        }

        const fallbackStart = dayjs();
        const fallbackEnd = fallbackStart.add(LENGTH_OF_DAYS_TO_SHOW, 'day');
        return reminders.filter(({ atUtc }) =>
            dayjs(atUtc).isBetween(fallbackStart, fallbackEnd, undefined, '[]'),
        );
    }, [reminders, nextSessionDate]);

    const remindersToShow = getRemindersForWeek;

    return (
        <View style={ { flex: 1 } }>
            <View pointerEvents='none' style={ StyleSheet.absoluteFill }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_LEFT } />
            </View>
            <SafeAreaView style={ styles.container }>
                <ScrollView style={ styles.scrollContent }>
                    <View style={ styles.header }>
                        <AppText
                            variant='h1'
                        >
                            Your tailored plan
                        </AppText>
                        { remindersToShow.map(({ atUtc, reason }) => (
                            <ReminderRow
                                key={ atUtc }
                                date={ dayjs(atUtc).format('dddd Do [at] h:mm A') }
                                description={ NEURO_REMINDER_COPY[reason].reason }
                                link={ NEURO_REMINDER_COPY[reason].link }
                            />
                        )) }
                    </View>
                </ScrollView>
                <View style={ styles.buttons }>
                    <View style={ styles.button }>
                        <Button label='Back' onPress={ () => router.back() } />
                    </View >
                    <View  style={ styles.button }>
                        <Button
                            label='Next'
                            onPress={ handleNext }
                            loading={ checkingPermission }
                            disabled={ checkingPermission }
                        />
                    </View>
                </View>
            </SafeAreaView>
            { sessionsError && (
                <ErrorModal
                    visible={ errorVisible }
                    title={ sessionsError.title }
                    message={ sessionsError.message }
                    buttonLabel={ sessionsError.retryable && sessionsError.actionLabel ? sessionsError.actionLabel : undefined }
                    onPress={ sessionsError.retryable ? handleErrorRetry : undefined }
                    onClose={ handleErrorClose }
                />
            ) }
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        gap: 16,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent:'center',
        paddingHorizontal: 20,

        gap: 4,
    },
    button: {
        width: '50%'
    }
});
