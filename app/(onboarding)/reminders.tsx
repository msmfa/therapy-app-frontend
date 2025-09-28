// app/(onboarding)/reminders.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import ReminderOptionCard from '../../src/components/reminders/reminder-card';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { calculateTherapyReminderTimes } from '../../src/components/reminders/reminder-schedule-algo';
import dayjs from 'dayjs'

enum ReminderType {
	Custom = 'custom',
	ScienceBacked = 'science-backed',
}


export default function RemindersScreen() {
    const [reminderType, setReminderType] = useState<ReminderType>(ReminderType.ScienceBacked);
    const router = useRouter();
    const { sessions } = useTherapySessions();
    const defaultTimeForReminders = 20; // 8:00 PM
    const today = new Date();


    const dates = sessions.map(session => session.startsAtUtc);
    const nextSession = dates[0];
    console.log("dates", dates);

    // const daysBetween = dayjs(sessionAfterNextSession).diff(dayjs(nextSession), 'day');

    const therapyReminderTime = calculateTherapyReminderTimes(new Date(dates[0]), new Date(dates[1]), defaultTimeForReminders);
    console.log("test!", therapyReminderTime);

    if (!nextSession) return null;

    const nextSessionText = `Your next session is in ${dayjs(nextSession).diff(dayjs(today), 'day')} day(s). At the end of your session we'll send you a note to remind you to log your insights.`;

    // we will have no notes to show them until their next session so actually we don/t need to do anything.
    // instead we will show a message saying your next session is in 1 day. At the end of your session we'll send you a note
    // to remind you to log your insights.  this will be start at + duration?


    const handleNext = () => {
        // You can save the reminder preference here
        router.push('/(onboarding)/success');
    };

    return (
        <SafeAreaView style={ styles.container }>
            <ScrollView style={ styles.scrollContent }>
                <View style={ styles.header }>
                    <Text style={ styles.title }>Your reminders</Text>
                    <Text style={ styles.subtitle }>
                        We place reminders at specific points between your therapy sessions. This schedule is based on a combination of memory science, neuroplasticity research, and psychotherapy studies.
                    </Text>
                    <Pressable onPress={ () => router.push('/(onboarding)/why-reminders') }>
                        <Text style={ { color: '#007AFF', marginTop: 8 } }>Read more about the science behind your reminders here</Text>
                    </Pressable>

                    <Text style={ styles.subtitle }>
                        Based on your therapy schedule the best schedule is as follow:
                    </Text>
                </View>



                <View style={ styles.options }>
                    <ReminderOptionCard
                        isSelected={ reminderType === ReminderType.ScienceBacked }
                        onPress={ () => setReminderType(ReminderType.ScienceBacked) }
                        icon="🧠"
                        title="Science-based pattern"
                        description="Multiple reminders for optimal neuroplasticity"
                        options={ [
                            'Day after session - Practice while fresh',
                            'Mid-week - Reinforce when memory fades',
                            'Day before - Prepare for next session',
                        ] }
                    />

                    <Text style={ styles.subtitle }>
                        { nextSessionText }
                    </Text>

                    { /* <ReminderOptionCard
                        isSelected={ reminderType === ReminderType.Custom }
                        onPress={ () => setReminderType(ReminderType.Custom) }
                        icon="📅"
                        title="Custom schedule"
                        description="Pick your own reminder times"
                        options={ [
                            'Choose specific days and times',
                            'Set one-time or recurring reminders',
                            'Full flexibility over your schedule',
                        ] }
                    /> */ }
                </View>
            </ScrollView>

            <View style={ styles.buttons }>
                <Pressable style={ [styles.button, styles.backButton] } onPress={ () => router.back() }>
                    <Text style={ styles.backButtonText }>Back</Text>
                </Pressable>
                <Pressable style={ styles.button } onPress={ handleNext }>
                    <Text style={ styles.buttonText }>Next</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
    },
    options: {
        marginBottom: 20,
    },
    buttons: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
    },
    button: {
        flex: 1,
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: '#f0f0f0',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    backButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: '600',
    },
});

export type TherapySessionSyncPayload = {
    id?: string;
    startsAtUtc: string;
    durationMin?: number;
};

export type TherapySessionSyncResult = {
    created: number;
    updated: number;
    deleted: number;
};
