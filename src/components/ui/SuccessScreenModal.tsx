import React from 'react';
import { View, StyleSheet, Modal, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_VARIANTS, palette } from '../../../new-design';

type SuccessScreenProps = {
    isVisible: boolean;
    iconSize?: number;
    iconColor?: string;
    onClose: () => void;
};

export default function SuccessScreen({ isVisible, onClose, iconSize = 96, iconColor = COLOR_VARIANTS.green.mid }: SuccessScreenProps) {
    return (
        <Modal
            visible={ isVisible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <View style={ styles.container }>
                <Ionicons name="checkmark-circle" size={ iconSize } color={ iconColor } />
            </View>
            <View style={ styles.modalClose }>
                <Button title="Close" onPress={ onClose } />
            </View>
        </Modal>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: palette.neutral.transparentTransparent,
    },
    modalClose: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
});
