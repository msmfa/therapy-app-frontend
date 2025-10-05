import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { colors, palette } from '../../../new-design';

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
    successText = 'Success!',
    size = 50,
    color = colors.text,
    successColor =  colors.text,
    onSuccess,
}: LoadingSuccessProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const checkFadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (status === 'success') {
        // Fade out spinner
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 1500, // ← How long spinner takes to fade out (in ms)
                useNativeDriver: true,
            }).start(() => {
            // Delay before checkmark appears (optional)
                setTimeout(() => {
                // Fade in and scale up checkmark
                    Animated.parallel([
                        Animated.timing(checkFadeAnim, {
                            toValue: 1,
                            duration: 100, // ← How long checkmark takes to fade in
                            useNativeDriver: true,
                        }),
                        Animated.spring(scaleAnim, {
                            toValue: 1,
                            friction: 19, // ← Higher = less bouncy
                            tension: 180, // ← Higher = faster/snappier
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        onSuccess?.();
                    });
                }, 0); // ← ADD THIS: Delay between spinner fadeout and checkmark (in ms)
            });
        } else {
            fadeAnim.setValue(1);
            checkFadeAnim.setValue(0);
            scaleAnim.setValue(0);
        }
    }, [status, fadeAnim, checkFadeAnim, scaleAnim, onSuccess]);
    return (
        <Modal
            transparent
            visible={ visible }
            animationType="fade"
            statusBarTranslucent
        >
            <View style={ styles.fullScreenContainer } pointerEvents="auto">
                <Animated.View style={ { opacity: fadeAnim, position: 'absolute' } }>
                    <ActivityIndicator size={ size } color={ color } />
                </Animated.View>
                <Animated.View
                    style={ {
                        opacity: checkFadeAnim,
                        transform: [{ scale: scaleAnim }],
                        position: 'absolute',
                        bottom: 0,
                        top: 0,
                        left: 0,
                        right: 0,
                        justifyContent: 'center',
                        alignItems: 'center',
                    } }
                >
                    <Ionicons name="checkmark-circle" size={ size } color={ successColor } />
                    { successText && (
                        <AppText variant="body" style={ [styles.text, { color: successColor }] }>
                            { successText }
                        </AppText>
                    ) }
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: palette.overlay.taupeTransparent,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
    },
});
