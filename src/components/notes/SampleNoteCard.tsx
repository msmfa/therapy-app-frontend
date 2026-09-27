import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '../ui/AppText';
import { NoteCard } from './NoteCard';
import { REVIEW_PROGRESS_PREVIEWS } from './reviewProgressPreview';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import type { Note } from '../../features/notes/useNotes';
import { useTranslation } from 'react-i18next';

/**
 * A worked example of a note, shown above the empty state.
 *
 * Built from the real NoteCard rather than a mock-up of one, so it cannot drift
 * from what the user will actually get. Labelled, because an unlabelled note in
 * a list of your own notes reads as one of yours - and in a therapy app that is
 * a confusing thing to get wrong.
 */
// Fixed so the sample never reads as today's note.
const SAMPLE_CREATED_AT = Date.UTC(2026, 7, 24, 19, 0);

// Part way through, so the bar shows colour rather than an empty track.
const SAMPLE_PROGRESS = REVIEW_PROGRESS_PREVIEWS[2].progress;

export function SampleNoteCard() {
    const { t } = useTranslation('notes');
    const styles = useThemedStyles(makeStyles);
    const { theme } = useTheme();
    const sampleNote: Note = {
        id: 'sample-note',
        text: t('sample.text'),
        createdAt: SAMPLE_CREATED_AT,
    };

    return (
        <View style={ styles.root }>
            <View pointerEvents='none'>
                <NoteCard
                    item={ sampleNote }
                    index={ 0 }
                    onPress={ () => {} }
                    progress={ SAMPLE_PROGRESS }
                    style={ styles.note }
                />
            </View>
            <View pointerEvents='none' style={ styles.badge }>
                <LinearGradient
                    colors={ theme.scheme === 'dark'
                        ? ['#294A70', '#1B3452']
                        : ['#E0EEFF', '#B9D4F4'] }
                    start={ { x: 0, y: 0 } }
                    end={ { x: 1, y: 1 } }
                    style={ styles.badgeSurface }
                >
                    <AppText variant='caption' style={ styles.label }>
                        { t('empty.example') }
                    </AppText>
                </LinearGradient>
            </View>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    root: {
        marginTop: 26,
        // The paragraph below carries its own 14, so 8 here lands the gap under
        // the example on the same 22 as the gap above it.
        marginBottom: 8,
    },
    badge: {
        position: 'absolute',
        top: -14,
        left: -7,
        zIndex: 1,
        transform: [{ rotate: '-9deg' }],
        borderRadius: 999,
        shadowColor: theme.scheme === 'dark' ? theme.shadow : '#71879A',
        shadowOffset: { width: 3, height: 5 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
        elevation: 25,
    },
    note: {
        borderRadius: 18,
        backgroundColor: theme.scheme === 'dark' ? theme.surface.sheetTint : '#EDF1F4',
        borderColor: theme.scheme === 'dark' ? theme.surface.cardBorder : '#D7E0E7',
        borderTopColor: theme.scheme === 'dark' ? theme.surface.cardEdge : '#FFFFFF',
        borderLeftColor: theme.scheme === 'dark' ? theme.surface.cardEdge : '#FFFFFF',
        shadowColor: theme.scheme === 'dark' ? theme.shadow : '#71879A',
        shadowOffset: { width: 4, height: 7 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 6,
        paddingHorizontal: 18,
        paddingTop: 26,
        paddingBottom: 18,
    },
    badgeSurface: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.scheme === 'dark' ? '#43698F' : '#A8C7E9',
        borderTopColor: theme.scheme === 'dark' ? theme.surface.cardEdge : '#FFFFFF',
        borderLeftColor: theme.scheme === 'dark' ? theme.surface.cardEdge : '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 9,
    },
    label: {
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1.2,
        fontWeight: '400',
        color: theme.scheme === 'dark' ? '#E0EEFF' : '#234C7B',
    },
});
