import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import TherapyCalendar from '../../src/components/therapy-calendar/TherapyCalendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { Button } from '../../src/components/ui/Button';
import OnboardingSteps from 'src/components/ui/OnboardingSteps';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { useFocusEffect } from 'expo-router';
import LoadingSuccess from 'src/components/ui/LoadingWithSuccess';


const stepsText = {
    one: 'Press on a date on the calendar to update your therapy session. You can set one date and apply it to up to 2 months in advance',
    two: "Once you're done press the button below to save them",
};
type SelectedSessions = Record<string, Date>;


export default function CalendarScreen() {
    const { sessions, syncSessions, neuroReminders } = useTherapySessions();
    const [loading, setLoading] = useState<'loading' | 'success' | null>(null);
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
        }, [initialSessions, neuroReminders, normalizeReminderDates]),
    );

    const sessionCount = Object.keys(selectedSessions).length;


    const handleSessionsChange = useCallback((next: SelectedSessions) => {
        setSelectedSessions(next);
    }, []);

    const handleSavePress = useCallback(async () => {
        setLoading('loading');
        try {
            if (sessionCount < 5) {
                Alert.alert('Oops', 'Please select at least five therapy sessions to update.', [
                    { text: 'OK', style: 'default' },
                ]);
                setLoading(null); // ← Reset here since we're returning early
                return;
            }
            await syncSessions(selectedSessions, 50);
            setLoading('success');

            // Auto-dismiss after showing success - no setTimeout here!

        } catch (error) {
            console.error('syncSessions failed', error);
            Alert.alert('Error', 'Unable to save sessions right now.');
            setLoading(null);
        }
    // ← Remove the finally block that was setting loading to null
    }, [selectedSessions, sessionCount, syncSessions]);

    // Delay resetting loading state after success
    useEffect(() => {
        if (loading === 'success') {
            const timer = setTimeout(() => {
                setLoading(null);
            }, 2500); // Show success for 2.5 seconds

            return () => clearTimeout(timer);
        }
    }, [loading]);

    const handleClearAll = useCallback(() => {
        setDotDates([]);
        handleSessionsChange({});
    }, [handleSessionsChange]);

    useEffect(() => {
        setDotDates(normalizeReminderDates(neuroReminders));
    }, [neuroReminders, normalizeReminderDates]);

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <TherapyCalendar
                dotDates={ dotDates }
                onSelectedSessionsChange={ handleSessionsChange }
                selectedSessions={ selectedSessions }
            >
                <Spacer variant={ SpacerVariant.small } />
            </TherapyCalendar>
            <GradientRow addedStyles={ { position: 'absolute', bottom: 10, right: 10, left: 10 } } >
                <OnboardingSteps
                    title='Update your therapy sessions'
                    steps={ [
                        stepsText.one,
                        stepsText.two,
                    ] }
                />
                <Spacer variant={ SpacerVariant.small } />
                <View style={ styles.buttonsWrapper }>
                    <Button
                        addedStyles={ { width: '48%' } }
                        disabled={ sessionCount === 0 }
                        label="Update"
                        onPress={ handleSavePress }
                    />
                    <Button
                        addedStyles={ { width: '48%' } }
                        transparent
                        disabled={ sessionCount === 0 }
                        label="Clear"
                        onPress={ handleClearAll }
                    />
                </View>
                <Spacer variant={ SpacerVariant.medium } />
            </GradientRow>
            { loading &&
            <LoadingSuccess
                visible={ !!loading }
                status={ loading }
                successText="Updated your therapy sessions"
            /> }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#00000000',
        position: 'relative',
    },
    buttonsWrapper: {
        // position: 'absolute',
        // bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});
