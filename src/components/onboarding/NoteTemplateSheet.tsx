import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AppText from '../ui/AppText';
import {
    POST_THERAPY_QUESTIONS,
    POST_THERAPY_TEMPLATE_INTRO,
    POST_THERAPY_TEMPLATE_SUBTITLE,
    POST_THERAPY_TEMPLATE_TITLE,
} from '../../constants/postTherapyTemplate';
import { remainingQuestions } from '../../features/onboarding/onboardingCopy';

// The cheatsheet's ink, so the preview sheet reads as the same paper the note
// editor uses rather than a new surface invented for onboarding.
const INK = 'hsl(219, 52%, 14%)';
const INK_SOFT = 'hsla(219, 52%, 14%, 0.68)';

const QUESTIONS_SHOWN = 2;

/**
 * A read-only preview of the post-therapy template.
 *
 * Deliberately not one accessible container: VoiceOver has to reach each sample
 * question, so the questions are the accessible elements and the ruled lines
 * beneath them are hidden as decoration.
 */
export function NoteTemplateSheet({ style }: { style?: StyleProp<ViewStyle> }) {
    const shown = POST_THERAPY_QUESTIONS.slice(0, QUESTIONS_SHOWN);

    return (
        <ImageBackground
            source={ require('../../../assets/textures/paper-green.png') as ImageSourcePropType }
            resizeMode="cover"
            imageStyle={ styles.sheetImage }
            style={ [styles.sheet, style] }
        >
            <AppText variant="h2" style={ styles.sheetTitle } accessibilityRole="header">
                { POST_THERAPY_TEMPLATE_TITLE }
            </AppText>
            <AppText variant="caption" style={ styles.sheetSubtitle }>
                { POST_THERAPY_TEMPLATE_SUBTITLE }
            </AppText>

            <AppText variant="body" style={ styles.sheetIntro }>
                { POST_THERAPY_TEMPLATE_INTRO }
            </AppText>

            <View style={ styles.questions }>
                { shown.map((item, index) => (
                    <View
                        key={ item.question }
                        style={ styles.question }
                        accessible
                        accessibilityLabel={ `Question ${index + 1} of ${POST_THERAPY_QUESTIONS.length}. ${item.question}` }
                    >
                        <AppText
                            variant="caption"
                            style={ styles.questionNumber }
                            importantForAccessibility="no"
                        >
                            { String(index + 1) }
                        </AppText>
                        <View style={ styles.questionBody }>
                            <AppText variant="h3" style={ styles.questionText }>
                                { item.question }
                            </AppText>
                            { /* Decorative ruling: nothing for VoiceOver to read. */ }
                            <View style={ styles.writingLine } accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                            <View style={ [styles.writingLine, styles.writingLineShort] } accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                        </View>
                    </View>
                )) }
            </View>

            <AppText variant="caption" style={ styles.more }>
                { remainingQuestions(QUESTIONS_SHOWN, POST_THERAPY_QUESTIONS.length) }
            </AppText>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    sheet: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 22,
        borderRadius: 18,
        overflow: 'hidden',
    },
    sheetImage: {
        borderRadius: 18,
    },
    sheetTitle: {
        color: INK,
        fontSize: 19,
        lineHeight: 25,
    },
    sheetSubtitle: {
        color: INK_SOFT,
        marginTop: 2,
    },
    sheetIntro: {
        color: INK_SOFT,
        marginTop: 14,
        fontSize: 16,
        lineHeight: 23,
    },
    questions: {
        marginTop: 18,
        gap: 18,
    },
    question: {
        flexDirection: 'row',
        gap: 10,
    },
    questionNumber: {
        color: INK_SOFT,
        marginTop: 3,
    },
    questionBody: {
        flex: 1,
    },
    questionText: {
        color: INK,
        fontSize: 17,
        lineHeight: 24,
    },
    writingLine: {
        height: 1,
        marginTop: 14,
        backgroundColor: 'hsla(219, 52%, 14%, 0.18)',
    },
    writingLineShort: {
        width: '65%',
    },
    more: {
        color: INK_SOFT,
        marginTop: 18,
    },
});
