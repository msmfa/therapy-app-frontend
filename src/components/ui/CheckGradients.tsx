import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CheckGradients = () => {
    return (
        <View style={ styles.container }>
            <View style={ [styles.circle, styles.circle4] } />
            <View style={ [styles.circle, styles.circle3] } />
            <View style={ [styles.circle, styles.circle2] } />
            { /* Center circle with checkmark */ }
            <View style={ [styles.circle, styles.circle1] }>
                { /* Checkmark */ }
                <View style={ styles.checkmark }>
                    <Ionicons name="checkmark" size={ 20 } color={ 'white' } />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle4: {
        width: 160,
        height: 160,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    circle3: {
        width: 150,
        height: 150,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    circle2: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
    },
    circle1: {
        width: 50,
        height: 50,
        backgroundColor: 'rgb(16, 185, 129)',
    },
    checkmark: {
        width: 30,
        height: 30,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CheckGradients;
