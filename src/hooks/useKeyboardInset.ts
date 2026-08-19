import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions, type KeyboardEvent } from 'react-native';

/**
 * How many points of the window the keyboard currently covers.
 *
 * Read from the keyboard's own frame rather than delegating to
 * KeyboardAvoidingView, which measures itself against the window and so
 * misreports inside a Modal, and which cannot describe the split, undocked or
 * floating keyboards an iPad can present (app.json sets supportsTablet).
 *
 * Returns 0 while the keyboard is dismissed, and also while it floats clear of
 * the bottom edge, so callers can use the value directly as bottom padding.
 */
export function useKeyboardInset(): number {
    const { height: windowHeight } = useWindowDimensions();
    const [keyboardTop, setKeyboardTop] = useState<number | null>(null);

    useEffect(() => {
        const handleChange = (event: KeyboardEvent) => {
            setKeyboardTop(event.endCoordinates.screenY);
        };
        const handleHide = () => setKeyboardTop(null);

        const subscriptions = [
            Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame',
                handleChange,
            ),
            Keyboard.addListener(
                Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
                handleHide,
            ),
        ];

        return () => {
            subscriptions.forEach((subscription) => subscription.remove());
        };
    }, []);

    if (keyboardTop === null) {
        return 0;
    }

    // Derived at render rather than stored, so a rotation cannot leave a stale
    // inset behind on iPad.
    return Math.max(0, windowHeight - keyboardTop);
}
