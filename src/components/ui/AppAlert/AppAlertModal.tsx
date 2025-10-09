import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '../AppText';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import Spacer, { SpacerVariant } from '../Spacer';
import ErrorGradients from '../ErrorGradients';
import { Button } from '../Button';

type Props = {
    title: string;
    message: string;
    onRequestClose: () => void;
};

export function AppAlertModal({ title, message, onRequestClose }: Props) {
    return (
        <Modal
            animationType='fade'
            transparent
            visible
            onRequestClose={ onRequestClose }
            statusBarTranslucent
        >
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onRequestClose }
                    accessibilityRole='button'
                    accessibilityLabel='Dismiss alert'
                />

                <View
                    style={ styles.container }
                    accessibilityRole='alert'
                    accessibilityViewIsModal
                >
                    <Spacer variant={ SpacerVariant.large } />
                    <ErrorGradients />
                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant='h1' >
                        { title }
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='caption' align='center'>
                        { message }
                    </AppText>
                    <Spacer variant={ SpacerVariant.large } />
                    <Spacer variant={ SpacerVariant.medium } />
                    <Button label='Close' onPress={ onRequestClose } />
                    <Spacer variant={ SpacerVariant.medium } />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
        maxWidth: 360,
        backgroundColor: COLOR_VARIANTS.blue.lightest,
        borderRadius: 24,
        shadowColor: COLOR_VARIANTS.black.primary,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 6,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
});
