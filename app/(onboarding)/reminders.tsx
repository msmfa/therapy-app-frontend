import React, { JSX, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import { ReminderRow } from '../../src/components/reminders/ReminderRow';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { Button } from '../../src/components/ui/Button';
import { NEURO_REMINDER_COPY } from '../../src/constants/neuroReminders';
import AppText from '../../src/components/ui/AppText';

const LENGTH_OF_DAYS_TO_SHOW = 7;

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);

export default function RemindersScreen(): JSX.Element | null {
    const router = useRouter();
    const { sessions, neuroReminders } = useTherapySessions();

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

    const reminders = neuroReminders;

    const nextSessionDate = useMemo(() => {
        const now = Date.now();
        return orderedSessionDates.find((date) => date.getTime() >= now) ?? null;
    }, [orderedSessionDates]);

    const getRemindersForWeek = useMemo(() => {
        if (nextSessionDate) {
            const windowStart = dayjs(nextSessionDate);
            const windowEnd = windowStart.add(LENGTH_OF_DAYS_TO_SHOW, 'day');
            return reminders.filter(({ atUtc }) =>
                dayjs(atUtc).isBetween(windowStart, windowEnd, undefined, '[]'),
            );
        }

        const fallbackStart = dayjs();
        const fallbackEnd = fallbackStart.add(LENGTH_OF_DAYS_TO_SHOW, 'day');
        return reminders.filter(({ atUtc }) =>
            dayjs(atUtc).isBetween(fallbackStart, fallbackEnd, undefined, '[]'),
        );
    }, [reminders, nextSessionDate]);

    const remindersToShow = getRemindersForWeek;

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <ScrollView style={ styles.scrollContent }>
                <View style={ styles.header }>
                    <AppText
                        variant='h1'
                    >
                        Your tailored plan
                    </AppText>

                    { remindersToShow.map(({ atUtc, reason }) => (
                        <ReminderRow
                            key={ atUtc }
                            date={ dayjs(atUtc).format('dddd Do [at] h:mm A') }
                            description={ NEURO_REMINDER_COPY[reason].reason }
                            link={ NEURO_REMINDER_COPY[reason].link }
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
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        gap: 16,
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
