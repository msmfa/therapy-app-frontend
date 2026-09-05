import React from 'react';
import { Dimensions, Keyboard, ScrollView, StyleSheet, type KeyboardEvent } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NotePreviewModal } from '../NotesListScreenModal';
import type { Note } from '../../../features/notes/useNotes';

type Listener = (event: KeyboardEvent) => void;

const WINDOW_HEIGHT = 844;
const BOTTOM_INSET = 34;
const KEYBOARD_HEIGHT = 336;

// The keyboard frame is reported against the window, which the test renderer
// sizes independently of the safe area metrics above.
const SCREEN_HEIGHT = Dimensions.get('window').height;

const keyboardFrame = (coveredHeight: number) =>
    ({ endCoordinates: { screenY: SCREEN_HEIGHT - coveredHeight } } as KeyboardEvent);

const METRICS: Metrics = {
    frame: { x: 0, y: 0, width: 390, height: WINDOW_HEIGHT },
    insets: { top: 59, left: 0, right: 0, bottom: BOTTOM_INSET },
};

const note: Note = {
    id: 'note-1',
    text: 'A short note.',
    createdAt: new Date('2026-08-19T10:00:00Z').getTime(),
} as Note;

function captureListeners() {
    const listeners: Record<string, Listener> = {};

    jest.spyOn(Keyboard, 'addListener').mockImplementation((eventName: string, listener: Listener) => {
        listeners[eventName] = listener;
        return { remove: jest.fn() } as never;
    });

    return listeners;
}

function renderModal(onUpdateNote = jest.fn().mockResolvedValue(undefined)) {
    return render(
        <SafeAreaProvider initialMetrics={ METRICS }>
            <NotePreviewModal
                visible
                note={ note }
                onClose={ jest.fn() }
                onUpdateNote={ onUpdateNote }
            />
        </SafeAreaProvider>,
    );
}

const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

afterEach(() => {
    jest.restoreAllMocks();
});

describe('NotePreviewModal editing layout', () => {
    it('retains an edit after saving fails and allows retrying it', async () => {
        const updateNote = jest.fn()
            .mockRejectedValueOnce(new Error('Unable to update note right now.'))
            .mockResolvedValueOnce(undefined);
        renderModal(updateNote);
        fireEvent.press(screen.getByLabelText('Edit note'));
        fireEvent.changeText(screen.getByLabelText('Edit note'), 'Keep the revised reflection');

        await act(async () => { fireEvent.press(screen.getByLabelText('Save changes')); });

        expect(screen.getByLabelText('Edit note').props.value).toBe('Keep the revised reflection');
        expect(screen.getByText('Unable to update note right now.')).toBeTruthy();

        await act(async () => { fireEvent.press(screen.getByLabelText('Save changes')); });
        expect(updateNote).toHaveBeenNthCalledWith(2, 'note-1', 'Keep the revised reflection');
        expect(screen.queryByLabelText('Save changes')).toBeNull();
    });

    it('prevents duplicate saves and keeps the editor open while saving', async () => {
        let finishSave!: () => void;
        const updateNote = jest.fn(() => new Promise<void>(resolve => { finishSave = resolve; }));
        renderModal(updateNote);
        fireEvent.press(screen.getByLabelText('Edit note'));
        fireEvent.changeText(screen.getByLabelText('Edit note'), 'Pending edit');
        act(() => {
            fireEvent.press(screen.getByLabelText('Save changes'));
            fireEvent.press(screen.getByLabelText('Save changes'));
            fireEvent.press(screen.getByLabelText('Back'));
        });

        expect(updateNote).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Edit note').props.editable).toBe(false);
        await act(async () => { finishSave(); });
    });

    it('leaves the text input as the only scroller while editing', () => {
        captureListeners();
        renderModal();

        fireEvent.press(screen.getByLabelText('Edit note'));

        // A multiline TextInput is a UITextView, which scrolls itself and keeps
        // the caret visible. Wrapping it in a ScrollView makes it grow instead,
        // and then nothing follows the caret as you type.
        expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    });

    it('bounds the text input to the space left over, instead of letting it grow', () => {
        captureListeners();
        renderModal();

        fireEvent.press(screen.getByLabelText('Edit note'));

        const inputStyle = StyleSheet.flatten(screen.getByLabelText('Edit note').props.style);
        expect(inputStyle.flex).toBe(1);
        expect(inputStyle.minHeight).toBeUndefined();
    });

    it('keeps the action buttons in the layout flow, so they cannot cover the text', () => {
        captureListeners();
        renderModal();

        fireEvent.press(screen.getByLabelText('Edit note'));

        const actionsStyle = styleOf('note-modal-actions');
        expect(actionsStyle.position).not.toBe('absolute');
        // No hand-tuned reservation on the text side either: the old
        // paddingBottom: 120 never matched the ~135pt the bar actually took.
        expect(styleOf('note-modal-root').paddingBottom).toBe(BOTTOM_INSET);
    });

    it('shrinks by the keyboard height once the keyboard appears', () => {
        const listeners = captureListeners();
        renderModal();

        fireEvent.press(screen.getByLabelText('Edit note'));
        act(() => {
            listeners.keyboardWillChangeFrame(keyboardFrame(KEYBOARD_HEIGHT));
        });

        // The keyboard already covers the home indicator, so this is the larger
        // of the two insets, not their sum.
        expect(styleOf('note-modal-root').paddingBottom).toBe(KEYBOARD_HEIGHT);
    });

    it('gives the home indicator its space back when the keyboard hides', () => {
        const listeners = captureListeners();
        renderModal();

        fireEvent.press(screen.getByLabelText('Edit note'));
        act(() => {
            listeners.keyboardWillChangeFrame(keyboardFrame(KEYBOARD_HEIGHT));
        });
        act(() => {
            listeners.keyboardWillHide(keyboardFrame(0));
        });

        expect(styleOf('note-modal-root').paddingBottom).toBe(BOTTOM_INSET);
    });

    it('still scrolls the note when reading it', () => {
        captureListeners();
        renderModal();

        expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(1);
        expect(screen.getByText('A short note.')).toBeTruthy();
    });
});
