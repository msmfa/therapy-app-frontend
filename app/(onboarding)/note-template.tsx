import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../src/context/theme';
import { NoteSheetBackdrop } from '../../src/components/notes/NoteSheetBackdrop';
import { TemplateHelpModal } from '../../src/components/notes/TemplateHelpModal';
import { CurvedArrow } from '../../src/components/onboarding/CurvedArrow';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import AppText from '../../src/components/ui/AppText';
import { noteTemplateCopy } from '../../src/features/onboarding/onboardingCopy';

/**
 * The cheat sheet, and nothing else.
 *
 * The plan screen before this one says a template exists and names it; this is
 * the template. It used to be reachable only by pressing the template's name
 * inside that paragraph, which made the one thing the user is being asked to
 * fill in every week an optional detour off a sentence.
 *
 * It is a picture of the sheet here, tilted and bled off the bottom of the
 * page, with the readable copy one press away. The sheet is the screen's
 * backdrop rather than its content, so it can run under the action and off the
 * edge instead of being cut off by the bottom of the body's scroll.
 *
 * The backdrop cannot take a touch, so the body is one transparent control
 * filling the space over it, with the prompt drawn at the top of that control.
 */
export default function NoteTemplateScreen() {
    const styles = useThemedStyles(makeStyles);
    const { t } = useTranslation('onboarding');
    const router = useRouter();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [sheetOpen, setSheetOpen] = useState(false);
    // The prompt's own height, so the sheet can start under it without the
    // control's height being what decides where the paper begins.
    const [hintHeight, setHintHeight] = useState(0);

    // Inset from both edges, because the tilt swings the top and bottom corners
    // sideways by more than the sheet's own margin: run full width, and the
    // first word of every line turns off the side of the display.
    const sheetWidth = Math.round(screenWidth * SHEET_WIDTH_RATIO);
    // A whole display tall, so the paper runs off the bottom of the screen
    // whatever the copy on it sets to, rather than stopping above the action.
    const sheetHeight = screenHeight;

    return (
        <>
            <OnboardingScreen
                analyticsStep="note_template"
                // Nothing here scrolls, and the dissolve would be applied to the
                // picture rather than to a page moving behind it.
                fadeBodyEdges={ false }
                backHref="/(onboarding)/plan-preview"
                headline={ noteTemplateCopy().headline }
                bottomBackdrop={
                    <NoteSheetBackdrop
                        style={ [
                            styles.sheet,
                            {
                                width: sheetWidth,
                                height: sheetHeight,
                                marginTop: insets.top + HEADER_HEIGHT + hintHeight - SHEET_OVERLAP,
                            },
                        ] }
                        accessibilityLabel={ t('planPreview.sheetImage') }
                    />
                }
                footer={
                    <OnboardingButton
                        appearance="solid"
                        label={ noteTemplateCopy().primaryCta }
                        onPress={ () => router.push('/(onboarding)/reviews-preview') }
                    />
                }
            >
                <Pressable
                    style={ [styles.tapArea, { minHeight: screenHeight * TAP_AREA_RATIO }] }
                    onPress={ () => setSheetOpen(true) }
                    accessibilityRole="button"
                    accessibilityLabel={ noteTemplateCopy().openSheet }
                >
                    { /* The prompt and its arrow are one drawing: the words sit
                         at the top and the stroke sweeps down to the paper
                         beginning under them. */ }
                    <View
                        style={ styles.hint }
                        onLayout={ (event) => setHintHeight(event.nativeEvent.layout.height) }
                    >
                        <AppText variant="h3" style={ styles.hintLabel }>
                            { noteTemplateCopy().tapHint }
                        </AppText>
                        <View
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        >
                            <CurvedArrow />
                        </View>
                    </View>
                </Pressable>
            </OnboardingScreen>

            <TemplateHelpModal visible={ sheetOpen } onClose={ () => setSheetOpen(false) } />
        </>
    );
}

/** How much of the display's width the sheet takes, leaving the tilt room. */
const SHEET_WIDTH_RATIO = 0.92;

/**
 * The header row and the gutter under it, which the sheet starts below.
 *
 * Every other screen with a backdrop places it from where its body content
 * ends. Here the body is one tall control covering the sheet, so its height
 * says nothing about where the paper should begin: the row above it is named
 * here and the prompt's measured height is added to it. The backdrop is laid
 * out from the physical top of the display, so the status bar is added too.
 */
const HEADER_HEIGHT = 68;

/**
 * How much of the display the press target covers.
 *
 * Enough to reach over the whole of the sheet that can be seen, and short of
 * the body's own viewport so the screen does not become scrollable.
 */
const TAP_AREA_RATIO = 0.6;

/**
 * How far the sheet's top edge sits above where the prompt ends.
 *
 * The arrow finishes pointing at the paper, so the paper has to have started by
 * then; flush, the stroke was left aimed at the page beside it.
 */
const SHEET_OVERLAP = 18;

const makeStyles = (theme: Theme) => StyleSheet.create({
    tapArea: {
        alignSelf: 'stretch',
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    /**
     * The one piece of handwriting on the screen: the brand's italic serif, the
     * face the wordmark uses for its second word.
     */
    hintLabel: {
        fontFamily: 'InstrumentSerif-Italic',
        fontWeight: undefined,
        fontSize: 30,
        lineHeight: 34,
        color: theme.ink.secondary,
        marginTop: 6,
    },
    sheet: {
        alignSelf: 'center',
        borderRadius: 28,
        // Dropped onto the page rather than set square on it.
        transform: [{ rotate: '-3deg' }],
    },
});
