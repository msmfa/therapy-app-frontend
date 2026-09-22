import React from 'react';
import { ImageSourcePropType, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ImageBackground } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import {
    postTherapyQuestions,
    postTherapyTemplateIntro,
} from '../../constants/postTherapyTemplate';
import { useTranslation } from 'react-i18next';

type TemplateHelpModalProps = {
    visible: boolean;
    onClose: () => void;
};

// The paper, and a dark-grained copy of it for the night; the ink is
// theme.paper, navy by day and a light grey on the dark.
const PAPER = require('../../../assets/textures/paper-green.webp') as ImageSourcePropType;
const PAPER_NIGHT = require('../../../assets/textures/paper-green-dark.jpg') as ImageSourcePropType;

// One gutter for the header and the body, so the two columns line up.
const H_PADDING = 30;

export function TemplateHelpModal({ visible, onClose }: TemplateHelpModalProps) {
    const { t } = useTranslation('notes');
    const { t: tCommon } = useTranslation('common');
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <Modal
            visible={ visible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <ImageBackground
                testID="template-help-modal-root"
                source={ theme.scheme === 'dark' ? PAPER_NIGHT : PAPER }
                contentFit="cover"
                // The paper is the picture; the sheet behind it is the frame,
                // and only the frame follows the theme.
                style={ [
                    styles.modalRoot,
                    { backgroundColor: theme.surface.sheet, paddingTop: insets.top, paddingBottom: insets.bottom },
                ] }
            >
                <View style={ styles.header }>
                    <TouchableOpacity
                        onPress={ onClose }
                        accessibilityRole="button"
                        accessibilityLabel={ tCommon('action.back') }
                        style={ styles.backButton }
                        activeOpacity={ 0.7 }
                    >
                        <Feather name="arrow-left" size={ 22 } color={ theme.paper.ink } />
                    </TouchableOpacity>
                    <AppText variant="h1" style={ styles.headerWordSans }>
                        { t('cheatsheet.titleSans') }
                        <AppText variant="h1" style={ styles.headerWordSerif }>{ t('cheatsheet.titleSerif') }</AppText>
                    </AppText>
                </View>
                <ScrollView
                    style={ styles.scroll }
                    contentContainerStyle={ styles.scrollContent }
                    showsVerticalScrollIndicator={ false }
                >
                    <AppText variant="body" style={ styles.intro }>
                        { postTherapyTemplateIntro() }
                    </AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.questionList }>
                        { postTherapyQuestions().map((item) => (
                            <View key={ item.question }>
                                <AppText variant="h3" style={ styles.questionText }>
                                    { item.question }
                                </AppText>
                                <AppText variant="body" style={ styles.hintText }>
                                    { item.hint }
                                </AppText>
                            </View>
                        )) }
                    </View>
                </ScrollView>
            </ImageBackground>
        </Modal>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    modalRoot: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: H_PADDING, paddingTop: 20, paddingBottom: 32 },
    questionList: { gap: 26 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginLeft: H_PADDING,
        marginTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.paper.circle,
    },
    headerWordSans: {
        color: theme.paper.ink,
        fontWeight: '700',
        fontSize: 38,
        lineHeight: 46,
        letterSpacing: -0.5,
    },
    headerWordSerif: {
        color: theme.paper.ink,
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 40,
        lineHeight: 46,
        fontWeight: '400',
    },
    intro: { color: theme.paper.ink, fontSize: 18, lineHeight: 26 },
    questionText: { color: theme.paper.ink, fontSize: 19, lineHeight: 26 },
    hintText: { color: theme.paper.inkSoft, fontSize: 18, lineHeight: 26, marginTop: 2 },
});
