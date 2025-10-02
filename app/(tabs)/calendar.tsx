import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import SuccessScreenModal from '../../src/components/ui/SuccessScreenModal';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { Button } from '../../src/components/ui/button';

const regularText =
    'Press on a date on the calendar to update your therapy session. Then press the update button below to save them.';

type SelectedSessions = Record<string, Date>;


export default function CalendarScreen() {
    const { sessions, syncSessions } = useTherapySessions();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>(initialSessions);

    useEffect(() => {
        setSelectedSessions(initialSessions);
    }, [initialSessions]);

    const sessionCount = Object.keys(selectedSessions).length;

    const handleSavePress = useCallback(async () => {
        try {
            await syncSessions(selectedSessions, 50);
            setShowSuccessModal(true);
            Alert.alert('Saved', 'Therapy sessions updated.');
        } catch (error) {
            console.error('syncSessions failed', error);
            Alert.alert('Error', 'Unable to save sessions right now.');
        }
    }, [selectedSessions, syncSessions]);

    const handleClearAll = useCallback(() => {
        setSelectedSessions({});
    }, []);

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <TherapyCalendar
                onSelectedSessionsChange={ setSelectedSessions }
                selectedSessions={ selectedSessions }
            >
                <GradientRow>
                    <Text>
                        { regularText }
                    </Text>
                    <Text />
                    <View style={ styles.buttonsWrapper }>
                        <Button
                            addedStyles={ { width: '59%' } }
                            disabled={ sessionCount === 0 }
                            label="Update"
                            onPress={ handleSavePress }
                        />
                        <Button
                            addedStyles={ { width: '39%' } }
                            transparent
                            disabled={ sessionCount === 0 }
                            label="Clear All"
                            onPress={ handleClearAll }
                        />
                    </View>
                </GradientRow>
            </TherapyCalendar>
            <SuccessScreenModal isVisible={ showSuccessModal } onClose={ () => setShowSuccessModal(false) } />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    buttonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});
