import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import AppText from './AppText';
import { Button } from './Button';
import Spacer, { SpacerVariant } from './Spacer';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorModalProps {
    visible: boolean;
    title: string;
    message: string;
    buttonLabel?: string;
    onPress?: () => void;
    onClose: () => void;
}

export default function ErrorModal({
    visible,
    title,
    message,
    buttonLabel,
    onPress,
    onClose,
}: ErrorModalProps) {

    return (
        <Modal
            visible={ visible }
            animationType='slide'
            onRequestClose={ onClose }
        >
            <SafeAreaView style={ styles.root }>
                <View style={ styles.card }>
                    <AppText variant='h1' align='center'>
                        { title }
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body' align='center'>
                        { message }
                    </AppText>
                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.buttons }>
                        { buttonLabel && onPress && (
                            <Button
                                label={ buttonLabel }
                                onPress={ onPress }
                            />
                        ) }
                        <Spacer variant={ SpacerVariant.small } />
                        <Button
                            label='Close'
                            onPress={ onClose }
                            transparent
                        />
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.blue.lightest,
        paddingHorizontal: 0,
        borderWidth: 1,
    },
    card: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    buttons: {
        position: 'absolute',
        bottom: 44,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
});
