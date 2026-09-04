import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../ui/AppText';
import { COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';
import { ONBOARDING_QUESTION_COUNT } from '../../features/onboarding/onboardingCopy';

type Props = {
    step: number;
    total?: number;
};

/**
 * A thin bar over the four personalisation questions only.
 *
 * The rest of the flow (plan, note, subscription, account, notifications) is
 * deliberately outside the count: telling someone they are on step 1 of 11
 * before they have answered anything makes the flow feel longer than it is.
 */
export function OnboardingProgress({ step, total = ONBOARDING_QUESTION_COUNT }: Props) {
    const clamped = Math.min(Math.max(step, 1), total);
    const label = `${clamped} of ${total}`;

    return (
        <View
            style={ styles.container }
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={ `Step ${clamped} of ${total}` }
            accessibilityValue={ { min: 1, max: total, now: clamped } }
        >
            <View style={ styles.track }>
                <View style={ [styles.fill, { flex: clamped }] } />
                <View style={ { flex: total - clamped } } />
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
        gap: 8,
    },
    track: {
        flexDirection: 'row',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'hsla(0, 0%, 0%, 0.10)',
    },
    fill: {
        backgroundColor: COLOR_VARIANTS.black.primary,
        borderRadius: 2,
    },
    label: {
        color: TEXT_COLORS.tertiary,
    },
});
