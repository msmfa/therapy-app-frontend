import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import AppText from '../ui/AppText';
import { COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';

/**
 * What sits in the list before there is anything in it.
 *
 * Plain content rather than its own card: it shares a gradient card with the
 * worked example above it, so the two read as one introduction instead of two
 * competing surfaces.
 */
type Props = {
    /**
     * Slotted between the two paragraphs: what happens next, then a look at
     * what you will get, then how to start early.
     */
    children?: React.ReactNode;
};

export function EmptyNoteCard({ children }: Props) {
    const router = useRouter();
    const { nextSession } = useTherapySessions();

    const nextSessionDate = nextSession
        ? dayjs(nextSession.startsAtUtc).format('dddd, MMM D [at] h:mm A')
        : null;

    return (
        <View style={ styles.card }>
            <View style={ styles.header }>
                <AppText variant='h3' style={ styles.title }>
                    Your first note
                </AppText>
            </View>

            { /* Only promise a notification when there is a session to hang it
                 on. With nothing scheduled there is nothing to be reminded
                 after, so it points at the calendar instead. */ }
            { nextSessionDate ? (
                <AppText variant='bodySecondary' style={ styles.body }>
                    We&apos;ll send you a notification just after your next session on
                    { ' ' }
                    { /* Darker than the sentence around it: the date is the part
                         worth picking out at a glance. */ }
                    <AppText variant='bodySecondary' style={ styles.sessionDate }>
                        { nextSessionDate }
                    </AppText>
                    , so you can take down your first note. You&apos;ll then see it
                    here.
                </AppText>
            ) : (
                <AppText variant='bodySecondary' style={ styles.body }>
                    You have no sessions scheduled yet. Add one in the calendar and
                    we&apos;ll remind you just after it, so you can take down your
                    first note.
                </AppText>
            ) }

            { children }

            <AppText variant='bodySecondary' style={ styles.body }>
                If you want to get started now, tap the plus icon in the bottom left.
                It&apos;s worth reading a little bit about{ ' ' }
                <AppText
                    variant='bodySecondary'
                    onPress={ () => router.push('/how-to-take-notes') }
                    accessibilityRole='link'
                    style={ styles.link }
                >
                    what kind of note taking works best for therapy
                </AppText>
                { ' ' }first.
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingTop: 4,
    },
    header: {
        marginBottom: 10,
    },
    title: {
        textTransform: 'uppercase',
    },
    body: {
        marginBottom: 0,
        marginTop: 14,
        color: TEXT_COLORS.secondary,
    },
    sessionDate: {
        color: TEXT_COLORS.primary,
        fontWeight: '600',
    },
    link: {
        // The same red as the arrow on a card, so the two accents agree.
        color: COLOR_VARIANTS.red.primary,
        fontWeight: '600',
    },
});
