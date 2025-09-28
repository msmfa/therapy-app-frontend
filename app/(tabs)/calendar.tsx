import React, { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';

import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from './components/calendar';


export default function CalendarScreen() {
    const { sessions, syncSessions } = useTherapySessions();
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const handleSave = useCallback(
        async (selected: { [date: string]: Date }) => {
            try {
                await syncSessions(selected, 50);
                Alert.alert('Saved', 'Therapy sessions updated.');
            } catch (error) {
                console.error('syncSessions failed', error);
                Alert.alert('Error', 'Unable to save sessions right now.');
            }
        },
        [syncSessions],
    );

    return (
        <SafeAreaView>
            <TherapyCalendar
                initialSessions={ initialSessions }
                buttonAtBottom={ true }
                onSave={ handleSave }
            />
        </SafeAreaView>
    );
}
