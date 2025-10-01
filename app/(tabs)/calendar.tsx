import React, { useMemo, useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';

import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import SuccessScreenModal from '../../src/components/ui/SuccessScreenModal';


export default function CalendarScreen() {
    const { sessions, syncSessions } = useTherapySessions();
    const [showSuccessModal, setShowSuccessModal] = React.useState(false);
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const handleSave = useCallback(
        async (selected: { [date: string]: Date }) => {
            try {
                await syncSessions(selected, 50);
                setShowSuccessModal(true)
                Alert.alert('Saved', 'Therapy sessions updated.');
            } catch (error) {
                console.error('syncSessions failed', error);
                Alert.alert('Error', 'Unable to save sessions right now.');
            }
        },
        [syncSessions],
    );

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <TherapyCalendar
                initialSessions={ initialSessions }
                onSave={ handleSave }
            />
            <SuccessScreenModal isVisible={ showSuccessModal } onClose={ () => setShowSuccessModal(false) } />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
