import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal } from 'react-native';
import DancingSquare from './PulsingSquare';
import { GlassMorphismWithCircle } from './GlassMorphismWithCircle';
import { CirclePosition } from './LinearGradientCircle';
import CheckGradients from './CheckGradients';
import AppText from './AppText';
import { useReduceMotion } from '../../hooks/useReduceMotion';

type LoadingSuccessProps = {
    visible: boolean;
    status: 'loading' | 'success';
    text?: string;
    successText?: string;
    size?: number;
    color?: string;
    successColor?: string;
    onSuccess?: () => void;
};

export default function LoadingSuccess({
    visible,
    status,
    text,
    successText,
    onSuccess,
}: LoadingSuccessProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const checkFadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const reduceMotion = useReduceMotion();

    useEffect(() => {
        if (status === 'success') {
            // The spring's overshoot is decorative; Reduce Motion keeps the
            // checkmark's fade-in (the status change itself is essential) but
            // has it reach full size directly instead of bouncing past it.
            const checkmarkScale = reduceMotion
                ? Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
                : Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 19, // ← Higher = less bouncy
                    tension: 180, // ← Higher = faster/snappier
                    useNativeDriver: true,
                });

        // Fade out spinner
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 1500, // ← How long spinner takes to fade out (in ms)
                useNativeDriver: true,
            }).start(() => {
            // Delay before checkmark appears
                setTimeout(() => {
                // Fade in and scale up checkmark
                    Animated.parallel([
                        Animated.timing(checkFadeAnim, {
                            toValue: 1,
                            duration: 100, // ← How long checkmark takes to fade in
                            useNativeDriver: true,
                        }),
                        checkmarkScale,
                    ]).start(() => {
                        onSuccess?.();
                    });
                }, 0); // Delay between spinner fadeout and checkmark (in ms)
            });
        } else {
            fadeAnim.setValue(1);
            checkFadeAnim.setValue(0);
            scaleAnim.setValue(0);
        }
    }, [status, fadeAnim, checkFadeAnim, scaleAnim, onSuccess, reduceMotion]);

    // `text`/`successText` were accepted here and passed by the calendar's own
    // save flow, but never rendered: the icon swap was the only feedback, so a
    // VoiceOver user watching a session save got no confirmation it had, and a
    // sighted one had to infer "saved" from a checkmark with no caption.
    const statusText = status === 'success' ? successText : text;

    return (
        <Modal
            transparent
            visible={ visible }
            animationType="fade"
            statusBarTranslucent
        >
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } />
            </View>
            <View style={ styles.fullScreenContainer } pointerEvents="auto">
                <Animated.View style={ { opacity: fadeAnim, position: 'absolute' } }>
                    <DancingSquare />
                </Animated.View>
                <Animated.View
                    style={ {
                        opacity: checkFadeAnim,
                        transform: [{ scale: scaleAnim }],
                        ...styles.checkAnimation
                    } }
                >
                    <CheckGradients />
                </Animated.View>
                { statusText ? (
                    <AppText
                        testID="loading-success-status"
                        variant="body"
                        align="center"
                        style={ styles.statusText }
                        accessibilityLiveRegion="polite"
                    >
                        { statusText }
                    </AppText>
                ) : null }
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkAnimation: {
        position: 'absolute',
        bottom: 0,
        top: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: StyleSheet.absoluteFillObject,
    // Clears CheckGradients' widest ring (160pt) without needing to know
    // which of the two icons is showing, since both are centred on the
    // same point and this sits in normal flow below them.
    statusText: {
        marginTop: 110,
        paddingHorizontal: 32,
    },
});
