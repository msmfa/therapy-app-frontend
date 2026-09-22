import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import AppText from '../ui/AppText';
import { formattingLocale } from '../../i18n';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

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
    const styles = useThemedStyles(makeStyles);
    const router = useRouter();
    const { t } = useTranslation('notes');
    const { nextSession } = useTherapySessions();

    // Was a dayjs pattern with an English "[at]" baked into it, which stays
    // English however the app is set. Intl produces the locale's own joining
    // word and its own order of the parts.
    const nextSessionDate = nextSession
        ? new Intl.DateTimeFormat(formattingLocale(), {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(nextSession.startsAtUtc))
        : null;

    return (
        <View style={ styles.card }>
            <View style={ styles.header }>
                <AppText variant='h3' style={ styles.title }>
                    { t('empty.title') }
                </AppText>
            </View>

            { /* Only promise a notification when there is a session to hang it
                 on. With nothing scheduled there is nothing to be reminded
                 after, so it points at the calendar instead. */ }
            { nextSessionDate ? (
                <AppText variant='bodySecondary' style={ styles.body }>
                    { /* Trans, not string concatenation: the date sits mid
                         sentence and is styled darker than the words around it,
                         and where in the sentence it falls is the translator's
                         decision, not this component's. */ }
                    <Trans
                        t={ t }
                        i18nKey='empty.withSession'
                        values={ { date: nextSessionDate } }
                        components={ {
                            date: <AppText variant='bodySecondary' style={ styles.sessionDate } />,
                        } }
                    />
                </AppText>
            ) : (
                <AppText variant='bodySecondary' style={ styles.body }>
                    { t('empty.noSession') }
                </AppText>
            ) }

            { children }

            <AppText variant='bodySecondary' style={ styles.body }>
                <Trans
                    t={ t }
                    i18nKey='empty.getStarted'
                    components={ {
                        link: (
                            <AppText
                                variant='bodySecondary'
                                onPress={ () => router.push('/how-to-take-notes') }
                                accessibilityRole='link'
                                style={ styles.link }
                            />
                        ),
                    } }
                />
            </AppText>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
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
        color: theme.ink.secondary,
    },
    sessionDate: {
        color: theme.ink.primary,
        fontWeight: '600',
    },
    link: {
        // The same red as the arrow on a card, so the two accents agree.
        color: theme.status.dangerText,
        fontWeight: '600',
    },
});
