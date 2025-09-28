import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import Loading from '../../src/components/loading';
import { convertSessionsToCalendarFormat } from '../(tabs)/components/calendar';

export default function SessionsScreen() {
    const router = useRouter();
    const { sessions: existingSessions, syncSessions } = useTherapySessions();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (selectedSessions: { [date: string]: Date }) => {
        const sessionCount = Object.keys(selectedSessions).length;
        // console.log('sessions to save', sessions);
        // Check minimum sessions
        if (sessionCount < 4) {
            Alert.alert('Not Enough Sessions', 'Please add at least 4 therapy sessions.', [
                { text: 'OK', style: 'default' },
            ]);
            return;
        }

        setIsSaving(true);

        try {
            await syncSessions(selectedSessions, 50);
            router.push('/(onboarding)/reminders');
        } catch (error) {
            Alert.alert('Error', 'Failed to save sessions. Please try again.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    // Convert API sessions to calendar format
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(existingSessions),
        [existingSessions],
    );

    return (
        <SafeAreaView style={ styles.container }>
            <View style={ styles.content }>
                <Text style={ styles.title }>
                    Tell us your therapy sessions so we can work out when to remind you
                </Text>
                <SafeAreaView>
                    <TherapyCalendar
                        onSave={ handleSave }
                        buttonAtBottom={ true }
                        initialSessions={ initialSessions } // Pass the sessions here
                    />
                </SafeAreaView>
            </View>
            { isSaving && <Loading /> }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 10,
    },
});
