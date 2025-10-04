import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AppText from './typography';

type LoadingProps = {
	text?: string;
	size?: 'small' | 'large';
	color?: string;
	fullScreen?: boolean;
};

export default function Loading({
    text = 'Loading...',
    size = 'large',
    color = '#007AFF',
    fullScreen = true,
}: LoadingProps) {
    const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

    return (
        <View style={ containerStyle }>
            <ActivityIndicator size={ size } color={ color } />
            { text && (
                <AppText style={ styles.text } color="#666666">
                    { text }
                </AppText>
            ) }
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFFE6',
        zIndex: 999,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
    },
});
