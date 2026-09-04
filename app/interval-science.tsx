import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppText from 'src/components/ui/AppText';
import { Carousel } from 'src/components/ui/Carousel';
import { GlassCircleButton } from 'src/components/ui/GlassCircleButton';
import { Button } from 'src/components/ui/Button';
import { ReminderCard } from 'src/features/reminders/ReminderCard';
import { NEURO_REMINDER_COPY } from 'src/constants/neuroReminders';
import { ChartBackground } from 'src/components/ui/ChartBackground';
import { GlassMorphismWithSquare } from 'src/components/ui/GlassMorphismWithSquare';
import { SquarePosition } from 'src/components/ui/LinearGradientSquare';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { useOnboardingAnswers } from 'src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from 'src/features/onboarding/planTimeline';
import {
    intervalCardsFromPlan,
    intervalCardsFromSchedule,
} from 'src/features/reminders/intervalCards';
import { useTherapySessions } from 'src/context/therapy-sessions/TherapySessionsContext';

const HEADER_BUTTON_SIZE = 48;

export default function IntervalScienceScreen() {
    const router = useRouter();
    const { source } = useLocalSearchParams<{ source?: string | string[] }>();
    const showingOnboardingPlan = (Array.isArray(source) ? source[0] : source) === 'onboarding';
    const { answers, hydrated: answersHydrated } = useOnboardingAnswers();
    const {
        sessions,
        loading: sessionsLoading,
        neuroReminders,
        reminderScheduleSettings,
        reminderScheduleStatus,
        refreshReminderSchedule,
    } = useTherapySessions();

    const cards = useMemo(() => {
        if (showingOnboardingPlan) {
            if (!answersHydrated || answers.sessionAt === null) return [];

            return intervalCardsFromPlan(planTimeline({
                sessionAt: answers.sessionAt,
                cadence: answers.cadence,
                morningMinutes: answers.morningMinutes,
                eveningMinutes: answers.eveningMinutes,
            }));
        }

        if (reminderScheduleSettings === null) return [];
        return intervalCardsFromSchedule(
            neuroReminders,
            reminderScheduleSettings.timeZone,
        );
    }, [
        answers.cadence,
        answers.eveningMinutes,
        answers.morningMinutes,
        answers.sessionAt,
        answersHydrated,
        neuroReminders,
        reminderScheduleSettings,
        showingOnboardingPlan,
    ]);

    const waiting = showingOnboardingPlan
        ? !answersHydrated
        : sessionsLoading || (reminderScheduleStatus === 'loading' && cards.length === 0);
    const failed = !showingOnboardingPlan
        && reminderScheduleStatus === 'error'
        && cards.length === 0;

    const emptyBody = showingOnboardingPlan
        ? 'Add your following session to place exact review times in the gap.'
        : sessions.length === 0
            ? 'Add your next therapy sessions in Calendar to build a review schedule.'
            : 'There are no upcoming reviews in your current schedule.';

    return (
        <SafeAreaView style={ styles.container } edges={ ['top', 'left', 'right'] }>
            <ChartBackground />
            <GlassMorphismWithSquare squarePosition={ SquarePosition.BOTTOM_LEFT } />
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel="Back"
                    icon="back"
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ HEADER_BUTTON_SIZE }
                    onPress={ () => router.back() }
                    style={ styles.back }
                />
                <AppText variant="h3" align="center" style={ styles.title }>
                    Why these review moments
                </AppText>
            </View>

            <View style={ styles.deck }>
                { waiting ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">Loading your review times</AppText>
                    </View>
                ) : failed ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">We couldn't load your review times</AppText>
                        <AppText variant="body" align="center" style={ styles.stateBody }>
                            Check your connection and try again.
                        </AppText>
                        <View style={ styles.retry }>
                            <Button
                                label="Try again"
                                onPress={ () => void refreshReminderSchedule() }
                            />
                        </View>
                    </View>
                ) : cards.length === 0 ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">No review times yet</AppText>
                        <AppText variant="body" align="center" style={ styles.stateBody }>
                            { emptyBody }
                        </AppText>
                    </View>
                ) : (
                    <Carousel
                        data={ cards }
                        keyExtractor={ (card) => card.reason }
                        renderItem={ (card) => (
                            <ReminderCard
                                date={ NEURO_REMINDER_COPY[card.reason].time }
                                description={ NEURO_REMINDER_COPY[card.reason].reason }
                                link={ NEURO_REMINDER_COPY[card.reason].link }
                                time={ card.time }
                                caption={ card.caption }
                            />
                        ) }
                    />
                ) }
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
    // The title is centred on the page, so the back arrow sits over the row
    // rather than in it and cannot pull the title off centre.
    pageHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: HEADER_BUTTON_SIZE,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 8,
    },
    back: {
        position: 'absolute',
        left: 24,
    },
    // The type treatment the settings pages use for their headers.
    title: {
        textTransform: 'uppercase',
    },
    deck: {
        paddingTop: 8,
    },
    state: {
        minHeight: 280,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateBody: {
        marginTop: 10,
    },
    retry: {
        alignSelf: 'stretch',
        marginTop: 20,
    },
});
