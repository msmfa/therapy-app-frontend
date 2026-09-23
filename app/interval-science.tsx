import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppText from 'src/components/ui/AppText';
import { Carousel } from 'src/components/ui/Carousel';
import { GlassCircleButton } from 'src/components/ui/GlassCircleButton';
import { Button } from 'src/components/ui/Button';
import { ReminderCard } from 'src/features/reminders/ReminderCard';
import { neuroReminderCopy } from 'src/constants/neuroReminders';
import { ChartBackground } from 'src/components/ui/ChartBackground';
import { GlassMorphismWithSquare } from 'src/components/ui/GlassMorphismWithSquare';
import { SquarePosition } from 'src/components/ui/LinearGradientSquare';
import { useOnboardingAnswers } from 'src/features/onboarding/OnboardingAnswersContext';
import { planTimeline } from 'src/features/onboarding/planTimeline';
import {
    intervalCardsFromPlan,
    intervalCardsFromSchedule,
} from 'src/features/reminders/intervalCards';
import { useTherapySessions } from 'src/context/therapy-sessions/TherapySessionsContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'src/context/theme';

const HEADER_BUTTON_SIZE = 48;

export default function IntervalScienceScreen() {
    const { t } = useTranslation('common');
    const { t: tScience } = useTranslation('science');
    const router = useRouter();
    const { theme } = useTheme();
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
        ? tScience('intervals.emptyAddFollowing')
        : sessions.length === 0
            ? tScience('intervals.emptyAddSessions')
            : tScience('intervals.emptyNoSessions');

    return (
        <SafeAreaView
            // By day the page sits on ruled paper under a sheet of glass; at
            // night it is a plain black panel, and the cards carry the depth.
            style={ [styles.container, { backgroundColor: theme.scheme === 'dark' ? theme.ground.base : theme.surface.sheet }] }
            edges={ ['top', 'left', 'right'] }
        >
            { theme.scheme === 'light' && (
                <>
                    <ChartBackground />
                    <GlassMorphismWithSquare squarePosition={ SquarePosition.BOTTOM_LEFT } />
                </>
            ) }
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel={ t('action.back') }
                    icon="back"
                    iconColor={ theme.ink.primary }
                    size={ HEADER_BUTTON_SIZE }
                    onPress={ () => router.back() }
                />
                <AppText variant="h3" style={ styles.title }>{ tScience('intervals.title') }</AppText>
            </View>

            <View style={ styles.deck }>
                { waiting ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">{ tScience('intervals.loading') }</AppText>
                    </View>
                ) : failed ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">{ tScience('intervals.failedTitle') }</AppText>
                        <AppText variant="body" align="center" style={ styles.stateBody }>{ tScience('intervals.failedBody') }</AppText>
                        <View style={ styles.retry }>
                            <Button
                                label={ t('action.tryAgain') }
                                onPress={ () => void refreshReminderSchedule() }
                            />
                        </View>
                    </View>
                ) : cards.length === 0 ? (
                    <View style={ styles.state }>
                        <AppText variant="h2" align="center">{ tScience('intervals.emptyTitle') }</AppText>
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
                                date={ neuroReminderCopy()[card.reason].time }
                                description={ neuroReminderCopy()[card.reason].reason }
                                link={ neuroReminderCopy()[card.reason].link }
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
    },
    // The arrow sits in the row with the title beside it, at the gap the
    // other pages use, rather than floating over a centred title.
    pageHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 14,
        minHeight: HEADER_BUTTON_SIZE,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 8,
    },
    // The type treatment the settings pages use for their headers.
    title: {
        flexShrink: 1,
        letterSpacing: 0.5,
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
