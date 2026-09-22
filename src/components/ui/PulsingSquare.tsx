import { COLOR_VARIANTS } from 'designs/designs-colors';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { useReduceMotion } from '../../hooks/useReduceMotion';

const DancingSquare = () => {
    const animValue = useRef(new Animated.Value(0)).current;
    const reduceMotion = useReduceMotion();

    useEffect(() => {
        if (reduceMotion) {
            // The loop is decorative, not the loading state itself (the
            // square stays on screen for as long as its caller is loading),
            // so Reduce Motion just holds it at rest instead of looping.
            animValue.setValue(0);
            return;
        }

        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: false,
            })
        );
        loop.start();

        return () => loop.stop();
    }, [reduceMotion, animValue]);

    const rotation = animValue.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'],
    });

    const scale = animValue.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [1, 0.7, 1, 0.7, 1],
    });

    const borderRadius = animValue.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, 15, 0, 15, 0],
    });

    return (
        <Animated.View
            style={ [
                styles.dancingSquare,
                {
                    transform: [{ rotate: rotation }, { scale }],
                    borderRadius,
                },
            ] }
        />
    );
};

const styles = StyleSheet.create({
    dancingSquare: {
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: COLOR_VARIANTS.black.secondary,
    },
});

export default DancingSquare;
