import React from 'react'
import { Modal, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'
import { GradientUpwards } from './GradientUpwards'
import { Button } from './ui/button'

interface ModalProps {
    children: React.ReactNode;
    isVisible: boolean;
    onClose: () => void;
}

export function AppModal({ children, isVisible, onClose }: ModalProps) {
    if (!isVisible) return null;

    return (
        <Modal
            visible={ isVisible }
            animationType="slide"
            // presentationStyle="fullScreen"
            onRequestClose={ onClose }
        >
            <SafeAreaView style={ styles.modalRoot }>
                <GradientUpwards />
                <ScrollView contentContainerStyle={ styles.modalContent }>
                    { children }
                </ScrollView>
                <View style={ styles.modalClose }>
                    <Button label="Close" onPress={ onClose } />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: '#fff' },
    modalContent: { padding: 24, paddingBottom: 120, paddingTop: 60 },
    modalClose: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        borderRadius: 25,
        backgroundColor: '#111',
        paddingVertical: 12,
        alignItems: 'center',
    },
});
