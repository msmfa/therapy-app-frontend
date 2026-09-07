import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../ui/AppText';
import { TEXT_COLORS } from 'designs/designs-colors';
import { TickMeter } from '../ui/TickMeter';
import { ONBOARDING_QUESTION_COUNT } from '../../features/onboarding/onboardingCopy';

type Props = {
    step: number;
    total?: number;
    /**
     * Set on the header row, where the bar sits beside the back arrow rather
     * than on its own line under it. The row supplies the gutter, so the bar
     * drops its own and takes the width the arrow leaves.
     */
    inline?: boolean;
};

/**
 * A thin bar over the four personalisation questions only.
 *
 * The rest of the flow (plan, note, subscription, account, notifications) is
 * deliberately outside the count: telling someone they are on step 1 of 11
 * before they have answered anything makes the flow feel longer than it is.
 */
export function OnboardingProgress({ step, total = ONBOARDING_QUESTION_COUNT, inline = false }: Props) {
    const clamped = Math.min(Math.max(step, 1), total);
    const label = `${clamped} of ${total}`;

    return (
        <View
            style={ [styles.container, inline && styles.inlineContainer] }
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={ `Step ${clamped} of ${total}` }
            accessibilityValue={ { min: 1, max: total, now: clamped } }
        >
            <View style={ styles.meter }>
                { /* The app's own progress bar, the one the notes list uses for
                     reviews: grey ticks that take the red-to-orange ramp as the
                     count goes up. Shorter here, sitting in a header row rather
                     than on a card. */ }
                <TickMeter completed={ clamped } total={ total } height={ 12 } />
            </View>
            <AppText variant="caption" style={ styles.label }>
                { label }
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 8,
        gap: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inlineContainer: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 0,
    },
    meter: {
        flex: 1,
    },
    label: {
        color: TEXT_COLORS.secondary,
    },
});
