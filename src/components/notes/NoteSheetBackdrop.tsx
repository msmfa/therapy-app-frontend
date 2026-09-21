import React from 'react';
import { ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { ImageBackground } from 'expo-image';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import {
    postTherapyQuestions,
    postTherapyTemplateIntro,
} from '../../constants/postTherapyTemplate';

/**
 * The five-question sheet, shown behind a page as an illustration of itself.
 *
 * Drawn from `notes:template.*`, which is where that copy already lives:
 * `TemplateHelpModal` renders it the same way, and this shares its paper, ink
 * and measurements.
 *
 * Two screens used a screenshot of the sheet here instead, with the heading,
 * the guidance and all five questions burned into the pixels. It was only ever
 * right in the language it was captured in, and it could not be kept honest by
 * the app: the captures had already drifted from the wording they were meant
 * to be showing, and editing that wording did nothing to them. Every language
 * draws the sheet now, so the sheet always says what the resource says.
 */

// Very dark blue: near-black in weight, but clearly blue against the paper.
// Same values as TemplateHelpModal, which draws the same sheet.
const INK = 'hsl(219, 52%, 14%)';
const INK_SOFT = 'hsla(219, 52%, 14%, 0.68)';
const PAPER = require('../../../assets/textures/paper-green.webp') as ImageSourcePropType;

type Props = {
    accessibilityLabel: string;
    /**
     * Typed as an image style because both callers size and tilt this as an
     * image. Every property they pass is shared with a view style, so the sheet
     * takes it as-is.
     */
    style?: StyleProp<ImageStyle>;
};

export function NoteSheetBackdrop({ accessibilityLabel, style }: Props) {
    const { t } = useTranslation('notes');

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
    // margins the same way. The sheet is sized by this content now, so it also
    // needs the paper to carry on past the last line rather than stopping on it.
    body: {
        paddingHorizontal: 30,
        paddingVertical: 28,
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
