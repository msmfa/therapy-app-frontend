import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { PALETTE } from 'designs/designs-colors';
import DancingSquare from './PulsingSquare';

type LoadingProps = {
    fullScreen?: boolean;
    transparent?: boolean;
};

export default function Loading({
    fullScreen = true,
    transparent = false,
}: LoadingProps) {
    if (fullScreen) {
        return (
            <Modal
                transparent={ transparent }
                visible={ true }
                animationType="fade"
                statusBarTranslucent
            >
                <View style={ styles.fullScreenContainer } pointerEvents="auto">
                    <DancingSquare />
                </View>
            </Modal>
        );
    }

    return (
        <View style={ styles.container }>
            <View style={ styles.fullScreenContainer } pointerEvents="auto">
                <DancingSquare />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PALETTE.overlay.taupeTransparent,
        paddingHorizontal: 24,
    },
});
