import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../ui/AppText';
import { NoteCard } from './NoteCard';
import { REVIEW_PROGRESS_PREVIEWS } from './reviewProgressPreview';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';
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
    const sampleNote: Note = {
        id: 'sample-note',
        text: t('sample.text'),
        createdAt: SAMPLE_CREATED_AT,
    };

    return (
        <View style={ styles.root }>
            <AppText variant='caption' style={ styles.label }>
                { t('empty.example') }
            </AppText>
            <View pointerEvents='none'>
                <NoteCard
                    item={ sampleNote }
                    index={ 0 }
                    onPress={ () => {} }
                    progress={ SAMPLE_PROGRESS }
                />
            </View>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    root: {
        marginTop: 22,
        // The paragraph below carries its own 14, so 8 here lands the gap under
        // the example on the same 22 as the gap above it.
        marginBottom: 8,
    },
    label: {
        marginBottom: 6,
        paddingLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.ink.quaternary,
    },
});
