import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import AppText from './typography';

type LoadingProps = {
	text?: string;
	size?: 'small' | 'large';
	color?: string;
	fullScreen?: boolean;
    transparent?: boolean;
};

export default function Loading({
    text = 'Loading...',
    size = 'large',
    color = '#3e536aff',
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
                    <ActivityIndicator size={ size } color={ color } />
                </View>
            </Modal>
        );
    }

    return (
        <View style={ styles.container }>
            <ActivityIndicator size={ size } color={ color } />
            { text ? (
                <AppText variant='body' style={ styles.text }>
                    { text }
                </AppText>
            ) : null }
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
        backgroundColor: 'rgba(160, 139, 139, 0.92)', // ← Transparent background
        paddingHorizontal: 24,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
    },
});
