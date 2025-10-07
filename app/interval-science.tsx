import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientUpwards } from '../src/components/GradientUpwards';
import AppText from 'src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { ReminderRow } from 'src/features/reminders/ReminderRow';
import { NEURO_REMINDER_COPY } from 'src/constants/neuroReminders';
import { Reason } from 'src/features/reminders/reminder-schedule-v2';

const reminderEntries = Object.entries(NEURO_REMINDER_COPY) as Array<[
    Reason,
    (typeof NEURO_REMINDER_COPY)[Reason],
]>;

export default function IntervalScienceScreen() {

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <ScrollView
                contentContainerStyle={ styles.content }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant='h1'>
                    Why we place your reminders where we do
                </AppText>
                <AppText variant='body'>
                    Each interval is grounded in neuroplasticity, psychology and memory retention research so your follow-up work reinforces what you covered in session.
                </AppText>
                <Spacer variant={ SpacerVariant.small } />
                <View style={ styles.list }>
                    { reminderEntries.map(([key, copy]) => (
                        <ReminderRow
                            key={ key }
                            date={ copy.time }
                            description={ copy.reason }
                            link={ copy.link }
                        />
                    )) }
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        gap: 16,
    },
    list: {
        gap: 20,
    },
});
