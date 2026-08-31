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
    POST_THERAPY_TEMPLATE_SUBTITLE,
    POST_THERAPY_TEMPLATE_TITLE,
} from '../../constants/postTherapyTemplate';

type TemplateHelpModalProps = {
    visible: boolean;
    onClose: () => void;
};

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
                        <Feather name="arrow-left" size={ 22 } color={ COLOR_VARIANTS.black.primary } />
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
                    <AppText variant="h1">{ POST_THERAPY_TEMPLATE_TITLE }</AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant="h2">{ POST_THERAPY_TEMPLATE_SUBTITLE }</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body">{ POST_THERAPY_TEMPLATE_INTRO }</AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.questionList }>
                        { POST_THERAPY_QUESTIONS.map((item, index) => (
                            <View key={ item.question }>
                                <AppText variant="h3">
                                    { index + 1 }. { item.question }
                                </AppText>
                                <Spacer variant={ SpacerVariant.small } />
                                <AppText variant="body">{ item.hint }</AppText>
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
    scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    questionList: { gap: 24 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginLeft: 24,
        marginTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'hsla(0, 0%, 0%, 0.06)',
    },
    headerWordSans: {
        fontFamily: 'GeneralSans-Bold',
        fontSize: 30,
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    headerWordSerif: {
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '400',
    },
});
