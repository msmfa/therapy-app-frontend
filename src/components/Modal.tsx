import React from 'react'
import { Modal, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native';
import { Button } from './ui/Button'
import { GlassMorphismWithSquare } from './ui/GlassMorphismWithSquare';
import { SquarePosition } from './ui/LinearGradientSquare';

interface ModalProps {
    children: React.ReactNode;
    isVisible: boolean;
    onClose: () => void;
}

export function AppModal({ children, isVisible, onClose }: ModalProps) {
    if (!isVisible) return null;

    const { colors } = useTheme();

    return (
        <Modal
            visible={ isVisible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <View style={ [styles.modalWrapper, { backgroundColor: colors.background }] }>
                <View pointerEvents='none' style={ StyleSheet.absoluteFill }>
                    <GlassMorphismWithSquare squarePosition={ SquarePosition.MIDDLE_RIGHT } />
                </View>
                <SafeAreaView style={ styles.modalRoot }>
                    <ScrollView contentContainerStyle={ styles.modalContent }>
                        { children }
                    </ScrollView>
                    <View style={ styles.modalClose }>
                        <Button label="Close" onPress={ onClose } />
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalWrapper: { flex: 1 },
    modalRoot: { flex: 1 },
    modalContent: { padding: 12, paddingBottom: 65 },
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
