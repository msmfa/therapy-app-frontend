import { StyleSheet, View } from 'react-native';
import { TEXT_COLORS } from 'designs/designs-colors';
import AppText from '../ui/AppText';
import { ONBOARDING_SCREEN_PADDING } from './OnboardingScreen';
import { onboardingStyles } from './onboardingStyles';
import type { AccountSummaryRow } from '../../features/onboarding/accountSummary';

type Props = {
    rows: AccountSummaryRow[];
};

/** Faint: a rule that separates without being read as a line of its own. */
const RULE_COLOR = 'hsla(0, 0%, 0%, 0.18)';

/**
 * A thin dotted rule.
 *
 * iOS draws a dotted border only when all four edges have one, so the rule is
 * a box with a dotted border all round, clipped to its top edge.
 */
function DottedRule() {
    return (
        <View style={ styles.ruleClip } accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={ styles.rule } />
        </View>
    );
}

/**
 * The plan the account is about to hold, as a short receipt: each thing the
 * flow asked for, with the answer under it, and what happens next.
 *
 * A strip across the whole display rather than a card in the gutter, ruled
 * between its sections like a printed slip, so it reads as a record of what
 * was chosen rather than as one more panel of the page.
 */
export function AccountPlanSummary({ rows }: Props) {
    return (
        <View style={ [onboardingStyles.card, styles.card] }>
            { rows.map((row, index) => (
                <View key={ row.label }>
                    { index > 0 && <DottedRule /> }
                    <View style={ styles.row }>
                        <AppText variant="caption" style={ styles.label }>
                            { row.label }
                        </AppText>
                        <AppText variant="h3" style={ [onboardingStyles.title, styles.value] }>
                            { row.value }
                        </AppText>
                        { row.note !== undefined && (
                            <AppText variant="caption" style={ styles.note }>
                                { row.note }
                            </AppText>
                        ) }
                    </View>
                </View>
            )) }
        </View>
    );
}

const styles = StyleSheet.create({
    // Out through the gutter to both edges, square-cornered and with no side
    // edges of its own, so it is a band of the page and not a box on it.
    card: {
        marginHorizontal: -ONBOARDING_SCREEN_PADDING,
        paddingHorizontal: ONBOARDING_SCREEN_PADDING,
        paddingTop: 2,
        paddingBottom: 2,
        marginTop: 24,
        borderRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    row: {
        paddingVertical: 20,
    },
    // Back out through the strip's own padding, so the rule runs edge to edge.
    ruleClip: {
        height: 1,
        overflow: 'hidden',
        marginHorizontal: -ONBOARDING_SCREEN_PADDING,
    },
    rule: {
        height: 3,
        borderWidth: 1,
        borderStyle: 'dotted',
        borderColor: RULE_COLOR,
    },
    label: {
        color: TEXT_COLORS.tertiary,
    },
    value: {
        marginTop: 2,
        fontSize: 17,
    },
    note: {
        marginTop: 8,
        color: TEXT_COLORS.secondary,
    },
});
