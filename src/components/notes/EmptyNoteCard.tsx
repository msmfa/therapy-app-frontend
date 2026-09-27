import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import AppText from '../ui/AppText';
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
    /** The example note, between the first step and the two linked steps. */
    children?: React.ReactNode;
};

export function EmptyNoteCard({ children }: Props) {
    const styles = useThemedStyles(makeStyles);
    const router = useRouter();
    const { t } = useTranslation('notes');
    return (
        <View style={ styles.card }>
            <View style={ [styles.step, styles.firstStep] }>
                <AppText variant='bodySecondary' style={ styles.number }>1.</AppText>
                <AppText variant='bodySecondary' style={ [styles.body, styles.stepContent] }>
                    <Trans
                        t={ t }
                        i18nKey='empty.scheduleSessions'
                        components={ {
                            calendar: (
                                <AppText
                                    variant='bodySecondary'
                                    onPress={ () => router.push('/(tabs)/calendar') }
                                    accessibilityRole='link'
                                    style={ styles.link }
                                />
                            ),
                        } }
                    />
                </AppText>
            </View>

            { children }

            <View style={ styles.step }>
                <AppText variant='bodySecondary' style={ styles.number }>2.</AppText>
                <AppText variant='bodySecondary' style={ [styles.body, styles.stepContent] }>
                    <Trans
                        t={ t }
                        i18nKey='empty.readGuide'
                        components={ {
                            guide: (
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

            <View style={ styles.step }>
                <AppText variant='bodySecondary' style={ styles.number }>3.</AppText>
                <AppText variant='bodySecondary' style={ [styles.body, styles.stepContent] }>
                    <Trans
                        t={ t }
                        i18nKey='empty.addNow'
                        components={ {
                            add: (
                                <AppText
                                    variant='bodySecondary'
                                    onPress={ () => router.push('/(tabs)') }
                                    accessibilityRole='link'
                                    style={ styles.link }
                                />
                            ),
                        } }
                    />
                </AppText>
            </View>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    card: {
        paddingTop: 0,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 14,
    },
    firstStep: {
        marginTop: 0,
    },
    stepContent: {
        flex: 1,
    },
    number: {
        minWidth: 20,
        lineHeight: 24,
        fontWeight: '700',
        color: theme.ink.primary,
    },
    body: {
        lineHeight: 24,
        fontWeight: '700',
        color: theme.ink.secondary,
    },
    link: {
        color: theme.link.bright,
        fontWeight: '700',
    },
});
