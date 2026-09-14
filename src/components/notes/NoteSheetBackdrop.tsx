import React from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import {
    postTherapyQuestions,
    postTherapyTemplateIntro,
} from '../../constants/postTherapyTemplate';

/**
 * The five-question sheet, shown behind a page as an illustration of itself.
 *
 * Two screens used a screenshot of the sheet here: a 1290x2060 capture with
 * the heading, the guidance and all five questions burned into the pixels. In
 * English that is a designed asset and it looks right. In French it was a
 * panel of English prose filling a translated screen, and no amount of
 * translating the accessibility label changes what is on the glass.
 *
 * So the capture is used only for a language it was captured in, and every
 * other language gets the same sheet drawn from `notes:template.*`, which is
 * where that copy already lives: `TemplateHelpModal` renders it this way
 * already, and this shares its paper, ink and measurements.
 *
 * Drawing it also fixes a drift the captures had picked up. They read
 * "5 Minute Post Therapy Template" and "Answer these 5 questions after your
 * session", while the resource has said "Your five-minute therapy note" and
 * "Five questions to capture what mattered" for some time. A screenshot of
 * the app cannot be kept honest by the app.
 */

/**
 * The languages a capture exists for. Add a tag here when a capture is made
 * in that language; until then the tag falls through to the drawn sheet, which
 * is correct in every language rather than pixel-perfect in one.
 */
const CAPTURED_LANGUAGES = new Set(['en']);

// Very dark blue: near-black in weight, but clearly blue against the paper.
// Same values as TemplateHelpModal, which draws the same sheet.
const INK = 'hsl(219, 52%, 14%)';
const INK_SOFT = 'hsla(219, 52%, 14%, 0.68)';
const PAPER = require('../../../assets/textures/paper-green.webp') as ImageSourcePropType;

type Props = {
    /** The capture to use where one exists for the active language. */
    capture: ImageSourcePropType;
    accessibilityLabel: string;
    /**
     * Typed as an image style because both callers size and tilt this as an
     * image, and it has to satisfy the `Image` branch. Every property they
     * pass is shared with a view style, so the drawn branch takes it as-is.
     */
    style?: StyleProp<ImageStyle>;
};

export function NoteSheetBackdrop({ capture, accessibilityLabel, style }: Props) {
    const { t } = useTranslation('notes');
    const { i18n } = useTranslation();

    // The base subtag, so fr-CA and fr-FR resolve the same way the rest of the
    // app resolves them.
    const language = i18n.language.split('-')[0];

    if (CAPTURED_LANGUAGES.has(language)) {
        return (
            <Image
                source={ capture }
                style={ style }
                contentFit="contain"
                accessible
                accessibilityRole="image"
                accessibilityLabel={ accessibilityLabel }
            />
        );
    }

    return (
        <ImageBackground
            source={ PAPER }
            contentFit="cover"
            style={ [styles.sheet, style] }
            // One label for the whole sheet, matching the capture it stands in
            // for. The questions are reachable as text elsewhere on both of
            // these screens, so announcing each one here would only add a
            // second copy to swipe through.
            accessible
            accessibilityRole="image"
            accessibilityLabel={ accessibilityLabel }
        >
            <View style={ styles.body } pointerEvents="none">
                <AppText variant="h1" style={ styles.headingSans }>
                    { t('cheatsheet.titleSans') }
                    <AppText variant="h1" style={ styles.headingSerif }>
                        { t('cheatsheet.titleSerif') }
                    </AppText>
                </AppText>
                <AppText variant="body" style={ styles.intro }>
                    { postTherapyTemplateIntro() }
                </AppText>
                <View style={ styles.questionList }>
                    { postTherapyQuestions().map((item) => (
                        <View key={ item.question }>
                            <AppText variant="h3" style={ styles.question }>
                                { item.question }
                            </AppText>
                            <AppText variant="body" style={ styles.hint }>
                                { item.hint }
                            </AppText>
                        </View>
                    )) }
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    sheet: {
        overflow: 'hidden',
    },
    // The capture's own gutter, so the drawn sheet lines up with the page
    // margins the same way.
    body: {
        paddingHorizontal: 30,
        paddingTop: 28,
        gap: 18,
    },
    headingSans: {
        color: INK,
        fontWeight: '700',
        fontSize: 34,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    headingSerif: {
        color: INK,
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 36,
        lineHeight: 40,
        fontWeight: '400',
    },
    intro: { color: INK, fontSize: 16, lineHeight: 23 },
    questionList: { gap: 18 },
    question: { color: INK, fontSize: 17, lineHeight: 23 },
    hint: { color: INK_SOFT, fontSize: 16, lineHeight: 23, marginTop: 2 },
});
