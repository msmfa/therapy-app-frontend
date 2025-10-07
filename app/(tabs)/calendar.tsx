import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import TherapyCalendar, { COLORS } from '../../src/components/therapy-calendar/TherapyCalendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { Button } from '../../src/components/ui/Button';
import OnboardingSteps from 'src/components/ui/OnboardingSteps';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { useFocusEffect } from 'expo-router';
import LoadingSuccess from 'src/components/ui/LoadingWithSuccess';
import AppText from 'src/components/ui/AppText';
import ErrorModal from '../../src/components/ui/ErrorModal';

const stepsText = {
    one: 'Press on a date on the calendar to update your therapy session. You can set one date and apply it to up to 2 months in advance',
    two: "Once you're done press the button below to save them",
};
type SelectedSessions = Record<string, Date>;


export default function CalendarScreen() {
    const {
        sessions,
        syncSessions,
        neuroReminders,
        loading: sessionsLoading,
        error: sessionsError,
        refreshSessions,
    } = useTherapySessions();
    const [saveStatus, setSaveStatus] = useState<'loading' | 'success' | null>(null);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>(initialSessions);
    const normalizeReminderDates = useCallback((values: typeof neuroReminders) =>
        values
            .map((item) => {
                const date = new Date(item.atUtc);
                if (Number.isNaN(date.getTime())) {
                    return null;
                }
                return date.toISOString().split('T')[0];
            })
            .filter((value): value is string => Boolean(value)),
    [],);

    const [dotDates, setDotDates] = useState<string[]>(() => normalizeReminderDates(neuroReminders));

    useFocusEffect(
        useCallback(() => {
            setSelectedSessions(initialSessions);
            setDotDates(normalizeReminderDates(neuroReminders));
            return () => {};
        }, [initialSessions, neuroReminders, normalizeReminderDates]),
    );

    useFocusEffect(
        useCallback(() => {
            setErrorDismissed(false);
            if (sessionsError) {
                setErrorModalVisible(true);
            }
            return () => {};
        }, [sessionsError]),
    );

    const sessionCount = Object.keys(selectedSessions).length;

    const hasChanges = useMemo(() => {
        const serialize = (sessionsMap: SelectedSessions) =>
            Object.keys(sessionsMap)
                .sort()
                .map((key) => {
                    const value = sessionsMap[key];
                    return `${key}-${value instanceof Date ? value.getTime() : ''}`;
                })
                .join('|');

        return serialize(selectedSessions) !== serialize(initialSessions);
    }, [initialSessions, selectedSessions]);

    const canSave = hasChanges && sessionCount >= 5;
    const userStep = canSave ? 1 : 0;

    const handleSessionsChange = useCallback((next: SelectedSessions) => {
        setSelectedSessions(next);
    }, []);

    const handleClearAll = useCallback(() => {
        setDotDates([]);
        handleSessionsChange({});
    }, [handleSessionsChange]);

    const handleSavePress = useCallback(async () => {
        setSaveStatus('loading');
        try {
            if (sessionCount < 5) {
                Alert.alert('Oops', 'Please select at least five therapy sessions to update.', [
                    { text: 'OK', style: 'default' },
                ]);
                setSaveStatus(null); // ← Reset here since we're returning early
                return;
            }
            await syncSessions(selectedSessions, 50);
            setSaveStatus('success');

            // Auto-dismiss after showing success - no setTimeout here!

        } catch (error) {
            console.error('syncSessions failed', error);
            Alert.alert('Error', 'Unable to save sessions right now.');
            setSaveStatus(null);
        }
    // ← Remove the finally block that was setting loading to null
    }, [selectedSessions, sessionCount, syncSessions]);

    // Delay resetting loading state after success
    useEffect(() => {
        if (saveStatus === 'success') {
            const timer = setTimeout(() => {
                setSaveStatus(null);
            }, 2500); // Show success for 2.5 seconds

            return () => clearTimeout(timer);
        }
    }, [saveStatus]);


    useEffect(() => {
        setDotDates(normalizeReminderDates(neuroReminders));
    }, [neuroReminders, normalizeReminderDates]);

    useEffect(() => {
        if (sessionsError && !errorDismissed) {
            setErrorModalVisible(true);
        }

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



    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            { sessionsLoading && !sessions.length && (
                <View style={ styles.loadingFallback }>
                    <AppText variant='bodySecondary'>Loading your upcoming sessions…</AppText>
                </View>
            ) }
            <TherapyCalendar
                dotDates={ dotDates }
                onSelectedSessionsChange={ handleSessionsChange }
                selectedSessions={ selectedSessions }
            />

            <GradientCard addedStyles={ styles.calendarKey } borderRadius={ 10 }>
                <View style={ styles.calendarKeyContent }>
                    <View style={ { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 } }>
                        <View style={ styles.keyTherapy } />
                        <AppText variant='caption' >Therapy Session</AppText>
                    </View>
                    <View style={ { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 } }>
                        <View style={ styles.keyReminder } />
                        <AppText variant='caption' >Reminders</AppText>
                    </View>
                </View>
            </GradientCard>

            <GradientCard addedStyles={ styles.bottomGradient }>
                <OnboardingSteps
                    steps={ [
                        stepsText.one,
                        stepsText.two,
                    ] }
                    activeStep={ userStep }
                />
                <Spacer variant={ SpacerVariant.small } />
                <View style={ styles.buttonsWrapper }>
                    <Button
                        addedStyles={ styles.button }
                        disabled={ !canSave }
                        label="Update"
                        onPress={ handleSavePress }
                    />
                    <Button
                        addedStyles={ styles.button }
                        transparent
                        disabled={ sessionCount === 0 }
                        label="Clear"
                        onPress={ handleClearAll }
                    />
                </View>
                <Spacer variant={ SpacerVariant.medium } />
            </GradientCard>
            { saveStatus &&
            <LoadingSuccess
                visible={ !!saveStatus }
                status={ saveStatus }
                successText="Updated your therapy sessions"
            /> }
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    loadingFallback: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    calendarKey: {
        flex: 1,
        position: 'absolute',
        bottom: 262,
        right: 10,
        left: 10,
        borderRadius: 6,
    },
    calendarKeyContent:{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
    },
    keyReminder: {
        backgroundColor: COLORS.dotIndicator,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    keyTherapy: {
        borderWidth: 1,
        backgroundColor: COLORS.activeSessionBackground,
        borderColor: COLORS.activeSessionBorder,
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        right: 10,
        left: 10,
        paddingVertical: 15,
    },
    buttonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        width: '48%',
    },
});
