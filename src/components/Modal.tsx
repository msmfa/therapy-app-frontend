import React, { useRef, useState } from 'react'
import { Animated, LayoutChangeEvent, Modal, View, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native';
import { GlassCircleButton } from './ui/GlassCircleButton';
import AppText from './ui/AppText';
import { COLOR_VARIANTS, SURFACE_BLUE, SURFACE_BLUE_FADE } from 'designs/designs-colors';

interface ModalProps {
    children: React.ReactNode;
    isVisible: boolean;
    onClose: () => void;
    /** Sits in the header beside the cross. Omitted, the header is just the cross. */
    title?: string;
}

// The size the paper screens use for their header button, so the cross here
// lands where the back arrow does on the pages this modal opens from.
const CLOSE_BUTTON_SIZE = 48;

/** How deep the fade at each end of the scroll area runs. */
const FADE_HEIGHT = 36;

/**
 * How far you have to scroll for a fade to reach full strength. Shorter than
 * the fade itself, so the top edge softens as soon as the copy starts moving
 * rather than easing in over the first half-screen.
 */
const FADE_RAMP = 24;

/** Below this there is nothing to scroll, so the bottom fade stays off. */
const SCROLLABLE_EPSILON = 1;

export function AppModal({ children, isVisible, onClose, title }: ModalProps) {
    const { colors } = useTheme();
    // Read outside the Modal on purpose. A Modal renders in its own native view
    // hierarchy, where the safe-area view measures nothing and reports zero
    // insets, so the header would sit under the status bar. This hook reads the
    // app root's provider, and the inset is applied below as plain padding.
    const insets = useSafeAreaInsets();

    const scrollY = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    // The furthest the content can travel. Zero when it already fits.
    const maxOffset = Math.max(0, contentHeight - viewportHeight);
    const isScrollable = maxOffset > SCROLLABLE_EPSILON;

    // Fades in over the first few points of travel, so it is absent at rest.
    const topOpacity = scrollY.interpolate({
        inputRange: [0, FADE_RAMP],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Mirrors it at the far end: on until the last few points, off at the stop.
    const bottomOpacity = isScrollable
        ? scrollY.interpolate({
            inputRange: [Math.max(0, maxOffset - FADE_RAMP), maxOffset],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        })
        : 0;

    const handleViewportLayout = (event: LayoutChangeEvent) => {
        setViewportHeight(event.nativeEvent.layout.height);
    };

    if (!isVisible) return null;

    return (
        <Modal
            visible={ isVisible }
            animationType="slide"
            onRequestClose={ onClose }
        >
            <View style={ [styles.modalWrapper, { backgroundColor: colors.background }] }>
                <View
                    testID="app-modal-root"
                    style={ [styles.modalRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }] }
                >
                    <View style={ styles.header }>
                        <GlassCircleButton
                            accessibilityLabel="Close"
                            icon="close"
                            iconColor={ COLOR_VARIANTS.black.primary }
                            size={ CLOSE_BUTTON_SIZE }
                            onPress={ onClose }
                        />
                        { Boolean(title) && (
                            <AppText variant="h2" style={ styles.title } numberOfLines={ 2 }>
                                { title }
                            </AppText>
                        ) }
                    </View>

                    <View style={ styles.scrollArea }>
                        <Animated.ScrollView
                            testID="app-modal-scroll"
                            contentContainerStyle={ styles.modalContent }
                            showsVerticalScrollIndicator={ false }
                            scrollEventThrottle={ 16 }
                            onLayout={ handleViewportLayout }
                            onContentSizeChange={ (_width, height) => setContentHeight(height) }
                            onScroll={ Animated.event(
                                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                { useNativeDriver: true },
                            ) }
                        >
                            { children }
                        </Animated.ScrollView>

                        <Animated.View
                            testID="app-modal-fade-top"
                            pointerEvents="none"
                            style={ [styles.fade, styles.fadeTop, { opacity: topOpacity }] }
                        >
                            <LinearGradient
                                colors={ [SURFACE_BLUE, SURFACE_BLUE_FADE] }
                                style={ StyleSheet.absoluteFill }
                            />
                        </Animated.View>

                        <Animated.View
                            testID="app-modal-fade-bottom"
                            pointerEvents="none"
                            style={ [styles.fade, styles.fadeBottom, { opacity: bottomOpacity }] }
                        >
                            <LinearGradient
                                colors={ [SURFACE_BLUE_FADE, SURFACE_BLUE] }
                                style={ StyleSheet.absoluteFill } />
                        </Animated.View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalWrapper: { flex: 1 },
    modalRoot: { flex: 1 },
    // The cross sits at the top left, at the same inset as the back arrow on
    // the pages behind it, with the page's title beside it.
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 8,
    },
    // Shrinks and wraps rather than pushing the cross off its inset, since the
    // longer titles run to three words.
    title: {
        flexShrink: 1,
    },
    // Holds the scroll view and the two fades that sit over its ends.
    scrollArea: {
        flex: 1,
    },
    modalContent: { padding: 12, paddingBottom: 32 },
    // The fades run to the theme's own ground, SURFACE_BLUE, so copy dissolves
    // into the page rather than under a visible band.
    fade: {
        height: FADE_HEIGHT,
        left: 0,
        position: 'absolute',
        right: 0,
    },
    fadeTop: { top: 0 },
    fadeBottom: { bottom: 0 },
});
