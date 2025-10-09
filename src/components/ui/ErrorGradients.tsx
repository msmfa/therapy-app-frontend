import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type ErrorGradientsProps = {
    style?: StyleProp<ViewStyle>;
};

const OUTER_SIZE = 80;
const MIDDLE_SIZE = 75;
const INNER_RING_SIZE = 50;
const CORE_SIZE = 25;

const ErrorGradients = ({ style }: ErrorGradientsProps) => {
    return (
        <View style={ [styles.container, style] }>
            <View style={ [styles.circle, styles.circle4] } />
            <View style={ [styles.circle, styles.circle3] } />
            <View style={ [styles.circle, styles.circle2] } />
            { /* Center circle with checkmark */ }
            <View style={ [styles.circle, styles.circle1] }>
                { /* Checkmark */ }
                <View style={ styles.checkmark }>
                    <AntDesign name="exclamation" size={ 12 } color="white" />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: OUTER_SIZE,
        height: OUTER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    circle: {
        position: 'absolute',
        borderRadius: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle4: {
        width: OUTER_SIZE,
        height: OUTER_SIZE,
        backgroundColor: 'hsla(0, 64%, 75%, 0.15)',
    },
    circle3: {
        width: MIDDLE_SIZE,
        height: MIDDLE_SIZE,
        backgroundColor: 'hsla(0, 64%, 61%, 0.20)',
    },
    circle2: {
        width: INNER_RING_SIZE,
        height: INNER_RING_SIZE,
        backgroundColor: 'hsla(0, 64%, 51%, 0.35)',
    },
    circle1: {
        width: CORE_SIZE,
        height: CORE_SIZE,
        backgroundColor: 'hsla(0, 64%, 51%, 1)',
    },
    checkmark: {
        width: 30,
        height: 30,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ErrorGradients;
