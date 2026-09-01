import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../ui/AppText';
import { NoteCard } from './NoteCard';
import { REVIEW_PROGRESS_PREVIEWS } from './reviewProgressPreview';
import { TEXT_COLORS } from 'designs/designs-colors';
import type { Note } from '../../features/notes/useNotes';

/**
 * A worked example of a note, shown above the empty state.
 *
 * Built from the real NoteCard rather than a mock-up of one, so it cannot drift
 * from what the user will actually get. Labelled, because an unlabelled note in
 * a list of your own notes reads as one of yours - and in a therapy app that is
 * a confusing thing to get wrong.
 */
const SAMPLE_NOTE: Note = {
    id: 'sample-note',
    text: 'We spent most of the hour on how I brace for criticism before anything has actually happened. She pointed out that I do the same thing in meetings that I do with my brother, which I had never put together before.',
    // Fixed so the sample never reads as today's note.
    createdAt: Date.UTC(2026, 7, 24, 19, 0),
};

// Part way through, so the bar shows colour rather than an empty track.
const SAMPLE_PROGRESS = REVIEW_PROGRESS_PREVIEWS[2].progress;

export function SampleNoteCard() {
    return (
        <View style={ styles.root }>
            <AppText variant='caption' style={ styles.label }>
                Example
            </AppText>
            <View pointerEvents='none'>
                <NoteCard
                    item={ SAMPLE_NOTE }
                    index={ 0 }
                    onPress={ () => {} }
                    progress={ SAMPLE_PROGRESS }
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
        color: TEXT_COLORS.quaternary,
    },
});
