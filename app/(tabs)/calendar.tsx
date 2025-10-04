import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import SuccessScreenModal from '../../src/components/ui/SuccessScreenModal';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { Button } from '../../src/components/ui/button';
import OnboardingSteps from 'src/components/ui/OnboardingSteps';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';


const stepsText = {
    one: 'Press on a date on the calendar to update your therapy session. You can set one date and apply it to up to 2 months in advance',
    two: "Once you're done press the button below to save them",
};
type SelectedSessions = Record<string, Date>;


export default function CalendarScreen() {
    const { sessions, syncSessions, neuroReminders } = useTherapySessions();

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>(initialSessions);
    const [dotDates, setDotDates] = useState<string[]>(() => neuroReminders.map((item) => item.atUtc));

    useEffect(() => {
        setSelectedSessions(initialSessions);
    }, [initialSessions]);

    useEffect(() => {
        setDotDates(neuroReminders.map((item) => item.atUtc));
    }, [neuroReminders]);

    const sessionCount = Object.keys(selectedSessions).length;


    const handleSessionsChange = useCallback((next: SelectedSessions) => {
        setSelectedSessions(next);
        setDotDates([]);
    }, []);

    const handleSavePress = useCallback(async () => {
        try {
            // todo: change to something more reasonable
            if (sessionCount < 5) {
                Alert.alert('Oops', 'Please select at least five therapy sessions to update.', [
                    { text: 'OK', style: 'default' },
                ]);
                return;
            }
            await syncSessions(selectedSessions, 50);
            setShowSuccessModal(true);
            setDotDates([]);

        } catch (error) {
            console.error('syncSessions failed', error);
            Alert.alert('Error', 'Unable to save sessions right now.');
        }
    }, [selectedSessions, sessionCount, syncSessions]);

    const handleClearAll = useCallback(() => {
        handleSessionsChange({});
    }, [handleSessionsChange]);


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

                { /* <Spacer variant={ SpacerVariant.small } /> */ }
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
                <Spacer variant={ SpacerVariant.large } />

            </GradientRow>
            <SuccessScreenModal isVisible={ showSuccessModal } onClose={ () => setShowSuccessModal(false) } />
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
