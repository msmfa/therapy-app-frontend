import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { palette } from '../../../new-design';
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
                    <DancingSquare/>
                </View>
            </Modal>
        );
    }

    return (
        <View style={ styles.container }>
           <View style={ styles.fullScreenContainer } pointerEvents="auto">
                 <DancingSquare/>
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
        backgroundColor: palette.overlay.taupeTransparent,
        paddingHorizontal: 24,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
    },
});
