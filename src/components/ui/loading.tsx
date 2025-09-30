import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

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
            { text && <Text style={ styles.text }>{ text }</Text> }
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 999,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
});
