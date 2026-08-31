import React from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import { Button } from '../ui/Button';
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

// Warm dark backdrop sampled from the reference shot, lighter at the top.
const BACKDROP_TOP = 'hsl(28, 9%, 56%)';
const BACKDROP_BOTTOM = 'hsl(28, 9%, 28%)';
const WHITE = 'hsl(0, 0%, 100%)';
const CHIP_FILL = 'hsla(0, 0%, 100%, 0.16)';
const CHIP_BORDER = 'hsla(0, 0%, 100%, 0.3)';
const CARD_TITLE = 'hsl(0, 0%, 10%)';
const CARD_HINT = 'hsla(0, 0%, 0%, 0.55)';

export function TemplateHelpModal({ visible, onClose }: TemplateHelpModalProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={ visible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <View testID="template-help-modal-root" style={ styles.modalRoot }>
                <LinearGradient
                    colors={ [BACKDROP_TOP, BACKDROP_BOTTOM] }
                    style={ StyleSheet.absoluteFill }
                />
                <View
                    style={ [
                        styles.content,
                        { paddingTop: insets.top, paddingBottom: insets.bottom },
                    ] }
                >
                    <ScrollView
                        style={ styles.scroll }
                        contentContainerStyle={ styles.scrollContent }
                        showsVerticalScrollIndicator={ false }
                    >
                        <AppText variant="h1" align="center" style={ styles.title }>
                            { POST_THERAPY_TEMPLATE_TITLE }
                        </AppText>

                        <Spacer variant={ SpacerVariant.large } />
                        <View style={ styles.chip }>
                            <AppText variant="body" align="center" style={ styles.chipText }>
                                { POST_THERAPY_TEMPLATE_SUBTITLE }
                            </AppText>
                        </View>

                        <Spacer variant={ SpacerVariant.medium } />
                        <AppText variant="caption" align="center" style={ styles.intro }>
                            { POST_THERAPY_TEMPLATE_INTRO }
                        </AppText>

                        <Spacer variant={ SpacerVariant.large } />
                        <View style={ styles.cardList }>
                            { POST_THERAPY_QUESTIONS.map((item, index) => (
                                <View key={ item.question } style={ styles.card }>
                                    <AppText variant="h3" style={ styles.cardTitle }>
                                        { index + 1 }. { item.question }
                                    </AppText>
                                    <Spacer variant={ SpacerVariant.small } />
                                    <AppText variant="body" style={ styles.cardHint }>
                                        { item.hint }
                                    </AppText>
                                </View>
                            )) }
                        </View>
                    </ScrollView>

                    <View style={ styles.footer }>
                        <Button label="Close" onPress={ onClose } />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1 },
    content: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 32 },
    title: {
        fontFamily: 'DMSans-Regular',
        fontSize: 44,
        lineHeight: 52,
        fontWeight: '400',
        color: WHITE,
    },
    chip: {
        alignSelf: 'center',
        backgroundColor: CHIP_FILL,
        borderColor: CHIP_BORDER,
        borderWidth: 1,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    chipText: { color: WHITE },
    intro: { color: 'hsla(0, 0%, 100%, 0.75)', paddingHorizontal: 16 },
    cardList: { gap: 14 },
    card: {
        backgroundColor: WHITE,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        shadowColor: 'hsl(0, 0%, 0%)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
    },
    cardTitle: { color: CARD_TITLE },
    cardHint: { color: CARD_HINT },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
});
