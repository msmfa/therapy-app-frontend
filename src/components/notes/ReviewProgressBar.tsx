import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('notes');
    const { completed, total, hasSchedule, isComplete } = progress;

    // `count` is the number completed, not the total, because that is the
    // number the noun agrees with once this is translated: French reads
    // "1 révision sur 4" but "2 révisions sur 4".
    const caption = hasSchedule
        ? t('reviewProgress', { count: completed, total })
        : t('reviewProgressNone');

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
