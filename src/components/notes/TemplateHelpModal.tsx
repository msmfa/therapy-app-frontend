import React from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import { Button } from '../ui/Button';
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
            <View
                testID="template-help-modal-root"
                style={ [
                    styles.modalRoot,
                    { paddingTop: insets.top, paddingBottom: insets.bottom },
                ] }
            >
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

                <View style={ styles.footer }>
                    <Button label="Close" onPress={ onClose } />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: COLOR_VARIANTS.white.primary },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 },
    questionList: { gap: 24 },
    footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
});
