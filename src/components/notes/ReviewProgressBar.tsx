import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../ui/AppText';
import { TEXT_COLORS } from 'designs/designs-colors';
import { TickMeter } from '../ui/TickMeter';
import type { NoteReviewProgress } from '../../features/reviews';

type Props = {
    progress: NoteReviewProgress;
    /** Optional caption, e.g. while comparing states side by side. */
    label?: string;
    /** Off on the card, where the bar speaks for itself. */
    showCaption?: boolean;
};

export function ReviewProgressBar({ progress, label, showCaption = true }: Props) {
    const { completed, total, hasSchedule, isComplete } = progress;

    const caption = hasSchedule
        ? `${completed} of ${total} reviewed`
        : 'No reviews scheduled yet';

    return (
        <View style={ styles.root }>
            <TickMeter
                completed={ completed }
                total={ total }
                active={ hasSchedule }
                isComplete={ isComplete }
            />
            { showCaption && (
                <AppText variant='caption' style={ styles.caption }>
                    { label ?? caption }
                </AppText>
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 14,
    },
    caption: {
        marginTop: 8,
        color: TEXT_COLORS.tertiary,
    },
});
