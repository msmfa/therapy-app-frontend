import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import Loading from '../../src/components/ui/loading';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { Button } from '../../src/components/ui/button';

const onBoardingText = {
    one: 'Press on a date on the calendar to add your therapy sessions',
    two: 'Add at least two weeks of sessions',
    three: "Once you're done press the button below to save them",
};

type SelectedSessions = Record<string, Date>;


export default function SessionsScreen() {
    const router = useRouter();
    const { sessions: existingSessions, syncSessions } = useTherapySessions();
    const [isSaving, setIsSaving] = useState(false);

    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(existingSessions),
        [existingSessions],
    );

    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>(initialSessions);

    useEffect(() => {
        setSelectedSessions(initialSessions);
    }, [initialSessions]);

    const sessionCount = Object.keys(selectedSessions).length;

    const handleSavePress = async () => {
        if (sessionCount < 4) {
            Alert.alert('Not Enough Sessions', 'Please add at least 4 therapy sessions.', [
                { text: 'OK', style: 'default' },
            ]);
            return;
        }

        setIsSaving(true);

        try {
            await syncSessions(selectedSessions, 50);
            router.push('/(onboarding)/explanation');
        } catch (error) {
            Alert.alert('Error', 'Failed to save sessions. Please try again.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearAll = () => {
        setSelectedSessions({});
    };

    return (
        <SafeAreaView style={ styles.root }>
            <GradientUpwards />
            <View style={ styles.content }>
                <TherapyCalendar
                    onSelectedSessionsChange={ setSelectedSessions }
                    selectedSessions={ selectedSessions }
                >
                    <GradientRow>
                        <Text>
                            { onBoardingText.one }. { onBoardingText.two }.
                        </Text>
                        <Text>
                            { onBoardingText.three }. You can update your calendar at anytime.
                        </Text>
                        <View style={ styles.buttonsWrapper }>
                            <Button
                                addedStyles={ { width: '59%' } }
                                disabled={ sessionCount === 0 }
                                label="Add"
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
            </View>
            { isSaving && <Loading /> }
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({

    root: {
        flex: 1,
        backgroundColor: 'transparent',

        padding: 4,
    },
    content: {
        flex: 1,
    },
    buttonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});
