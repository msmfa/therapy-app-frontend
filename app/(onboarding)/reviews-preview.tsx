import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../src/context/theme';
import { BRAND_FONTS } from 'designs/designs-typography';
import AppText from '../../src/components/ui/AppText';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { useOnboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import {
    evidenceParts,
    reviewsPreviewCopy,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

/**
 * The goal set in bold inside the sentence that names it.
 *
 * Split rather than marked up, so the copy stays one readable sentence in the
 * resource file instead of a list of fragments. The phrase is interpolated into
 * that sentence, so it is always present verbatim; if a translation ever moves
 * or reshapes it, the sentence is returned whole rather than mangled.
 */
function markPriority(sentence: string, priority: string, styles: ReturnType<typeof makeStyles>): React.ReactNode {
    const at = sentence.indexOf(priority);
    if (at === -1) return sentence;

    return (
        <>
            { sentence.slice(0, at) }
            <AppText variant="body" style={ [styles.bannerText, styles.priority] }>
                { priority }
            </AppText>
            { sentence.slice(at + priority.length) }
        </>
    );
}

/**
 * Why the app will keep coming back to the note, in one band of orange.
 *
 * The band is the whole of the screen. The dated list of moments it used to
 * carry underneath is its own screen now: the reasoning and the schedule are
 * two different answers, and stacked together the band read as a caption
 * introducing a list rather than as the thing the screen exists to say.
 *
 * Three paragraphs, each doing a separate job. The first picks up the note the
 * last screen was about and says what happens to it next, because otherwise
 * this screen starts mid-thought. The second is where the times come from, the
 * research and this person's own answer in one sentence. The third says what
 * the next screen holds and that each reminder on it opens its own reasoning.
 */
export default function ReviewsPreviewScreen() {
    const styles = useThemedStyles(makeStyles);
    const { onboardingStyles } = useOnboardingStyles();
    const router = useRouter();
    const { answers } = useOnboardingAnswers();
    const { statement, priority } = evidenceParts(answers.goal);

    return (
        <OnboardingScreen
            analyticsStep="reviews_preview"
            backHref="/(onboarding)/note-template"
            headline={ reviewsPreviewCopy().headline }
            supporting={
                <>
                    <AppText variant="body" style={ [onboardingStyles.body, styles.bannerText] }>
                        { reviewsPreviewCopy().intro }
                    </AppText>

                    <AppText variant="body" style={ [onboardingStyles.body, styles.bannerText, styles.paragraph] }>
                        { priority === null ? statement : markPriority(statement, priority, styles) }
                    </AppText>

                    <AppText variant="body" style={ [onboardingStyles.body, styles.bannerText, styles.paragraph] }>
                        { reviewsPreviewCopy().nextPage }
                    </AppText>
                </>
            }
            supportingAppearance="banner"
            footer={
                <OnboardingButton
                    label={ reviewsPreviewCopy().primaryCta }
                    onPress={ () => router.push('/(onboarding)/review-schedule') }
                />
            }
        />
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    /**
     * A step up from the flow's body copy. The band is the whole of this
     * screen, so it is being read rather than glanced at under something else.
     */
    bannerText: {
        color: theme.emphasis.ink,
        fontSize: 21,
        lineHeight: 31,
    },
    paragraph: {
        marginTop: 16,
    },
    /**
     * The goal, picked out of the sentence that repeats it back. Weight rather
     * than a rule: underlined, a phrase this long took a line of its own
     * across three rows of the band and read as a link.
     *
     * Semibold, not bold. White on the brand orange already gains apparent
     * weight, and at full bold the phrase stopped reading as part of the
     * sentence it sits in.
     */
    priority: {
        fontFamily: BRAND_FONTS.semibold,
        fontWeight: undefined,
    },
});
