import { Dimensions, Keyboard, type KeyboardEvent } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { useKeyboardInset } from '../useKeyboardInset';

type Listener = (event: KeyboardEvent) => void;

function captureListeners() {
    const listeners: Record<string, Listener> = {};

    jest.spyOn(Keyboard, 'addListener').mockImplementation((eventName: string, listener: Listener) => {
        listeners[eventName] = listener;
        return { remove: jest.fn() } as never;
    });

    return listeners;
}

const windowHeight = Dimensions.get('window').height;

const frameEvent = (screenY: number) =>
    ({ endCoordinates: { screenY } } as KeyboardEvent);

afterEach(() => {
    jest.restoreAllMocks();
});

describe('useKeyboardInset', () => {
    it('reports nothing while the keyboard is dismissed', () => {
        captureListeners();

        const { result } = renderHook(() => useKeyboardInset());

        expect(result.current).toBe(0);
    });

    it('reports how much of the window the keyboard covers', () => {
        const listeners = captureListeners();

        const { result } = renderHook(() => useKeyboardInset());

        act(() => {
            listeners.keyboardWillChangeFrame(frameEvent(windowHeight - 336));
        });

        expect(result.current).toBe(336);
    });

    it('follows the keyboard when it resizes, rather than latching the first frame', () => {
        const listeners = captureListeners();

        const { result } = renderHook(() => useKeyboardInset());

        act(() => {
            listeners.keyboardWillChangeFrame(frameEvent(windowHeight - 336));
        });
        act(() => {
            listeners.keyboardWillChangeFrame(frameEvent(windowHeight - 292));
        });

        expect(result.current).toBe(292);
    });

    it('reports nothing for a keyboard floating clear of the bottom edge', () => {
        const listeners = captureListeners();

        const { result } = renderHook(() => useKeyboardInset());

        act(() => {
            listeners.keyboardWillChangeFrame(frameEvent(windowHeight + 40));
        });

        expect(result.current).toBe(0);
    });

    it('goes back to nothing once the keyboard hides', () => {
        const listeners = captureListeners();

        const { result } = renderHook(() => useKeyboardInset());

        act(() => {
            listeners.keyboardWillChangeFrame(frameEvent(windowHeight - 336));
        });
        act(() => {
            listeners.keyboardWillHide(frameEvent(windowHeight));
        });

        expect(result.current).toBe(0);
    });
});
