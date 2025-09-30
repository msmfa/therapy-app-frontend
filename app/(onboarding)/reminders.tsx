import React, { JSX, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { scheduleNeuroplasticityReminders } from '../../src/components/reminders/reminder-schedule-v2';
import { ReminderRow } from '../../src/components/reminders/ReminderRow';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/button';
import { Palette } from '../../design';
import { ReminderType } from '../../src/utils/types';

const LENGTH_OF_DAYS_TO_SHOW = 7;

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

const keyToTextDictionary = {
    post_session: {
        time: "Evening of your session",
        reason: "Right after therapy your brain starts forming new pathways. Reviewing your notes this evening strengthens those fresh changes before they fade. This is known as early consolidation.",
        link: ReminderType.EarlyConsolidation,
    },
    post_sleep: {
        time: "Morning after your session",
        reason: "During sleep your brain replays what it learned. A quick review the next morning helps those pathways settle in and grow stronger. This is known as sleep-dependent consolidation.",
        link: ReminderType.SleepDependentConsolidation,
    },
    mid_session: {
        time: "Between your sessions",
        reason: "New brain pathways need to be reactivated to grow stronger. This is known as spaced reactivation.",
        link: ReminderType.SpacedReactivation,
    },
    pre_session: {
        time: "Evening before your next session",
        reason: "Bringing the insight back the night before therapy reactivates the pathway, so the next session builds on it instead of starting fresh. This is known as state reinstatement.",
        link: ReminderType.StateReinstatement,
    }
} as const;


export default function RemindersScreen(): JSX.Element | null {
    const router = useRouter();
    const { sessions } = useTherapySessions();

    console.log("test")

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
            <GradientUpwards />
            <ScrollView style={ styles.scrollContent }>
                <View style={ styles.header }>
                    { /* <Text style={ styles.title }>Your reminders</Text> */ }
                    { /* move this to a new screen before it */ }
                    { /* <Text style={ styles.subtitle }>
                        We place your reminders at set times between sessions, based on memory science, neuroplasticity, and psychotherapy research. Click on a row below to read more.
                    </Text> */ }
                    { /* // fix this link */ }


                    <Text style={ [styles.subtitle, styles.sectionTitle] }>
                        Your tailored plan
                    </Text>

                    { remindersLimitedToOneWeek.map(({ atUtc, reason }) => (
                        <ReminderRow
                            key={ atUtc }
                            date={ dayjs(atUtc).format('dddd Do [at] h:mm A') }
                            description={ keyToTextDictionary[reason].reason }
                            link={ keyToTextDictionary[reason].link }
                        />
                    )) }
                </View>
            </ScrollView>
            <View style={ styles.buttons }>
                <View style={ styles.button }>
                    <Button label='Back' onPress={ () => router.back() } />
                </View >
                <View  style={ styles.button }>
                    <Button label='Next' onPress={ handleNext } />
                </View>
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
    subtitle: {
        fontSize: 18,
        color: Palette.maroon,
    },
    sectionTitle: {
        marginTop: 12,
        fontWeight: '600',
        color: '#333',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent:'center',
        paddingHorizontal: 20,

        gap: 4,
    },
    button: {
        width: '50%'
    }
});
