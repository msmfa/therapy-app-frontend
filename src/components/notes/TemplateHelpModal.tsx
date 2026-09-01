import React from 'react';
import { ImageBackground, ImageSourcePropType, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import {
    POST_THERAPY_QUESTIONS,
    POST_THERAPY_TEMPLATE_INTRO,
} from '../../constants/postTherapyTemplate';

type TemplateHelpModalProps = {
    visible: boolean;
    onClose: () => void;
};

const CIRCLE_FILL = 'hsla(0, 0%, 0%, 0.06)';

// Very dark blue: near-black in weight, but clearly blue against the paper.
const INK = 'hsl(219, 52%, 14%)';

// Same ink, eased back so the hints sit under the questions rather than beside them.
const INK_SOFT = 'hsla(219, 52%, 14%, 0.68)';

// One gutter for the header and the body, so the two columns line up.
const H_PADDING = 30;

export function TemplateHelpModal({ visible, onClose }: TemplateHelpModalProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={ visible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <ImageBackground
                testID="template-help-modal-root"
                source={ require('../../../assets/textures/paper-green.png') as ImageSourcePropType }
                resizeMode="cover"
                style={ [
                    styles.modalRoot,
                    { paddingTop: insets.top, paddingBottom: insets.bottom },
                ] }
            >
                <View style={ styles.header }>
                    <TouchableOpacity
                        onPress={ onClose }
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        style={ styles.backButton }
                        activeOpacity={ 0.7 }
                    >
                        <Feather name="arrow-left" size={ 22 } color={ INK } />
                    </TouchableOpacity>
                    <AppText variant="h1" style={ styles.headerWordSans }>
                        Cheat
                        <AppText variant="h1" style={ styles.headerWordSerif }>sheet</AppText>
                    </AppText>
                </View>
                <ScrollView
                    style={ styles.scroll }
                    contentContainerStyle={ styles.scrollContent }
                    showsVerticalScrollIndicator={ false }
                >
                    <AppText variant="body" style={ styles.intro }>
                        { POST_THERAPY_TEMPLATE_INTRO }
                    </AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.questionList }>
                        { POST_THERAPY_QUESTIONS.map((item) => (
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

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: COLOR_VARIANTS.white.primary },
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
        backgroundColor: CIRCLE_FILL,
    },
    headerWordSans: {
        color: INK,
        fontWeight: '700',
        fontSize: 38,
        lineHeight: 46,
        letterSpacing: -0.5,
    },
    headerWordSerif: {
        color: INK,
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 40,
        lineHeight: 46,
        fontWeight: '400',
    },
    intro: { color: INK, fontSize: 18, lineHeight: 26 },
    questionText: { color: INK, fontSize: 19, lineHeight: 26 },
    hintText: { color: INK_SOFT, fontSize: 18, lineHeight: 26, marginTop: 2 },
});
