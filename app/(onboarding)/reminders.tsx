import React, { JSX, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { scheduleNeuroplasticityReminders } from '../../src/components/reminders/reminder-schedule-v2';

const LENGTH_OF_DAYS_TO_SHOW = 7;

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

const keyToTextDictionary = {
    post_session: {
        time: "Evening of your session",
        reason: "Right after therapy your brain starts forming new pathways. A reminder this evening strengthens those fresh changes before they fade (early consolidation)."
    },
    post_sleep: {
        time: "Morning after your session",
        reason: "During sleep your brain replays what it learned. A reminder the next morning helps those pathways settle in and grow stronger (sleep-dependent consolidation)."
    },
    mid_session: {
        time: "Between your sessions",
        reason: "New brain pathways need to be reactivated to grow stronger. Our algorithm calculates the best times between sessions to remind you, so the circuits keep firing instead of weakening (spaced reactivation / systems consolidation)."
    },
    pre_session: {
        time: "Evening before your next session",
        reason: "Bringing the insight back the night before therapy reactivates the pathway, so the next session builds on it instead of starting fresh (state reinstatement)."
    }
} as const;


export default function RemindersScreen(): JSX.Element | null {
    const router = useRouter();
    const { sessions } = useTherapySessions();

    const orderedSessionDates = useMemo(() => {
        return [...sessions]
            .sort(
                (a, b) =>
                    new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime(),
            )
            .map((session) => new Date(session.startsAtUtc))
            .filter((date) => !Number.isNaN(date.getTime()));
    }, [sessions]);

    const handleNext = () => {
        router.push('/(onboarding)/success');
    };

    const reminders = scheduleNeuroplasticityReminders({
        nowUtc: new Date().toISOString(),
        sessionsUtc: orderedSessionDates.map((date) => date.toISOString()),
        reflectionHour: 20,
        morningHour: 7,
        startAfterDays: 3,
        cadenceDays: 4,
    });

    const remindersLimitedToOneWeek = useMemo(() => {
        const windowStart = dayjs();
        const windowEnd = windowStart.add(LENGTH_OF_DAYS_TO_SHOW, 'day');
        return reminders.filter(({ atUtc }) =>
            dayjs(atUtc).isBetween(windowStart, windowEnd, undefined, '[]'),
        );
    }, [reminders]);

    return (
        <SafeAreaView style={ styles.container }>
            <ScrollView style={ styles.scrollContent }>
                <View style={ styles.header }>
                    <Text style={ styles.title }>Your reminders</Text>
                    <Text style={ styles.subtitle }>
                        We place reminders at specific points between your therapy sessions. This
                        schedule is based on a combination of memory science, neuroplasticity
                        research, and psychotherapy studies.
                    </Text>

                    <Pressable onPress={ () => router.push('/(onboarding)/why-reminders') }>
                        <Text style={ styles.link }>
                            Read more about the science behind your reminders here
                        </Text>
                    </Pressable>

                    <Text style={ [styles.subtitle, styles.sectionTitle] }>
                        Based on your therapy schedule the best schedule is as follows:
                    </Text>

                    { remindersLimitedToOneWeek.map(({ atUtc, reason }) => (
                        <Text key={ atUtc } style={ styles.reminderRow }>
                            • { dayjs(atUtc).format('dddd Do MMM [at] h:mm A') } { keyToTextDictionary[reason].time }{ "\n" }
                            • { keyToTextDictionary[reason].reason }{ "\n" }
                        </Text>
                    )) }
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
        gap: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
    },
    sectionTitle: {
        marginTop: 12,
        fontWeight: '600',
        color: '#333',
    },
    link: {
        color: '#007AFF',
        marginTop: 8,
    },
    reminderRow: {
        fontSize: 16,
        color: '#333',
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
