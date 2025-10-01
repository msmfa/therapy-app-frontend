import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SuccessScreenProps = {
    iconSize?: number;
    iconColor?: string;
};

export default function SuccessScreen({ iconSize = 96, iconColor = '#22C55E' }: SuccessScreenProps) {
    return (
        <View style={ styles.container }>
            <Ionicons name="checkmark-circle" size={ iconSize } color={ iconColor } />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});
