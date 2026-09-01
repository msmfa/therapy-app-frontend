import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppText from 'src/components/ui/AppText';
import { Carousel } from 'src/components/ui/Carousel';
import { GlassCircleButton } from 'src/components/ui/GlassCircleButton';
import { ReminderCard } from 'src/features/reminders/ReminderCard';
import { NEURO_REMINDER_COPY } from 'src/constants/neuroReminders';
import { Reason } from 'src/features/reminders/types';
import { ChartBackground } from 'src/components/ui/ChartBackground';
import { GlassMorphismWithSquare } from 'src/components/ui/GlassMorphismWithSquare';
import { SquarePosition } from 'src/components/ui/LinearGradientSquare';
import { COLOR_VARIANTS } from 'designs/designs-colors';

const HEADER_BUTTON_SIZE = 48;

type IntervalCard = {
    reason: Reason;
    /** Only where the carousel names the interval differently. */
    title?: string;
    /** Spelled out on the card's aura panel. */
    time: string;
    /** The line under it, inside the panel. */
    caption: string;
};

const INTERVAL_CARDS: IntervalCard[] = [
    { reason: Reason.PostSession, time: '8PM', caption: 'After your session' },
    { reason: Reason.PostSleep, time: '9AM', caption: 'Morning after' },
    {
        reason: Reason.MidSession,
        title: 'Based on how many weekly sessions',
        time: '7PM',
        caption: 'Based on how many sessions you have a week',
    },
    { reason: Reason.PreSession, time: '9PM', caption: 'Before your next session' },
];

export default function IntervalScienceScreen() {
    const router = useRouter();

    return (

        <SafeAreaView style={ styles.container } edges={ ['top', 'left', 'right'] }>
            <ChartBackground />
            <GlassMorphismWithSquare squarePosition={ SquarePosition.BOTTOM_LEFT } />
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel='Back'
                    icon='back'
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ HEADER_BUTTON_SIZE }
                    onPress={ () => router.back() }
                    style={ styles.back }
                />
                <AppText variant='h3' align='center' style={ styles.title }>
                    Reminder Intervals
                </AppText>
            </View>

            <View style={ styles.deck }>
                <Carousel
                    data={ INTERVAL_CARDS }
                    keyExtractor={ (card) => card.reason }
                    renderItem={ (card) => (
                        <ReminderCard
                            date={ card.title ?? NEURO_REMINDER_COPY[card.reason].time }
                            description={ NEURO_REMINDER_COPY[card.reason].reason }
                            link={ NEURO_REMINDER_COPY[card.reason].link }
                            time={ card.time }
                            caption={ card.caption }
                        />
                    ) }
                />
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
});
