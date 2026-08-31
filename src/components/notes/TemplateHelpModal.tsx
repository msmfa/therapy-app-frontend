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
} from '../../constants/postTherapyTemplate';

type TemplateHelpModalProps = {
    visible: boolean;
    onClose: () => void;
};

// One tint for every circle, so the numbers read as siblings of the back button.
const CIRCLE_FILL = 'hsla(0, 0%, 0%, 0.06)';

const NUMBER_BADGE_SIZE = 34;

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
                    <AppText variant="h2" style={ styles.subtitle }>
                        { POST_THERAPY_TEMPLATE_SUBTITLE }
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant="body" style={ styles.intro }>
                        { POST_THERAPY_TEMPLATE_INTRO }
                    </AppText>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.questionList }>
                        { POST_THERAPY_QUESTIONS.map((item, index) => (
                            <View key={ item.question }>
                                <View style={ styles.questionRow }>
                                    <View style={ styles.numberBadge }>
                                        <AppText variant="h3" style={ styles.numberText }>
                                            { index + 1 }
                                        </AppText>
                                    </View>
                                    <AppText variant="h3" style={ styles.questionText }>
                                        { item.question }
                                    </AppText>
                                </View>
                                <Spacer variant={ SpacerVariant.small } />
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
    scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
    questionList: { gap: 26 },
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
        backgroundColor: CIRCLE_FILL,
    },
    headerWordSans: {
        fontWeight: '700',
        fontSize: 38,
        lineHeight: 46,
        letterSpacing: -0.5,
    },
    headerWordSerif: {
        fontFamily: 'InstrumentSerif-Italic',
        fontSize: 40,
        lineHeight: 46,
        fontWeight: '400',
    },
    subtitle: { fontSize: 20, lineHeight: 28 },
    intro: { fontSize: 18, lineHeight: 26 },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    numberBadge: {
        width: NUMBER_BADGE_SIZE,
        height: NUMBER_BADGE_SIZE,
        borderRadius: NUMBER_BADGE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: CIRCLE_FILL,
    },
    numberText: { fontSize: 17, lineHeight: 22 },
    questionText: { flex: 1, fontSize: 19, lineHeight: 26 },
    hintText: { fontSize: 18, lineHeight: 26, marginLeft: NUMBER_BADGE_SIZE + 12 },
});
