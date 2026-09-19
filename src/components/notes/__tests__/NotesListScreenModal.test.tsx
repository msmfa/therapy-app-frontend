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
    it('does not persist or report an edit when the text is unchanged', async () => {
        const updateNote = jest.fn().mockResolvedValue(undefined);
        renderModal(updateNote);
        fireEvent.press(screen.getByLabelText('Edit note'));
        fireEvent.changeText(screen.getByLabelText('Edit note'), `  ${note.text}  `);
        await act(async () => { fireEvent.press(screen.getByLabelText('Save changes')); });
        expect(updateNote).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Save changes')).toBeNull();
    });

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

it('keeps a failed review open, shows the error, and allows a successful retry', async () => {
    const close = jest.fn();
    const reviewed = jest.fn().mockRejectedValueOnce(new Error('Failed to save review. Please try again.')).mockResolvedValueOnce(undefined);
    render(<SafeAreaProvider initialMetrics={METRICS}>
        <NotePreviewModal visible note={note} canReview onClose={close} onUpdateNote={jest.fn()} onReviewed={reviewed} />
    </SafeAreaProvider>);
    await act(async () => { fireEvent.press(screen.getByLabelText('Mark reviewed')); });
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByText('Failed to save review. Please try again.')).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByLabelText('Mark reviewed')); });
    expect(reviewed).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1);
});

/**
 * Deleting a note is the one action in this modal that cannot be undone, so it
 * is behind a confirmation. The confirmation is a second state of the action
 * row rather than the app alert: `AppAlertProvider` mounts its modal above this
 * component, and iOS draws a modal presented from outside the presented one
 * behind it, so from in here the alert would not have been visible at all.
 */
describe('deleting a note', () => {
    const renderWithDelete = (
        onDeleteNote: jest.Mock,
        onClose: jest.Mock = jest.fn(),
    ) => render(
        <SafeAreaProvider initialMetrics={ METRICS }>
            <NotePreviewModal
                visible
                note={ note }
                onClose={ onClose }
                onUpdateNote={ jest.fn() }
                onDeleteNote={ onDeleteNote }
            />
        </SafeAreaProvider>,
    );

    it('asks first, and one press of the delete affordance deletes nothing', () => {
        const remove = jest.fn().mockResolvedValue(undefined);
        renderWithDelete(remove);

        fireEvent.press(screen.getByLabelText('Delete note'));

        expect(remove).not.toHaveBeenCalled();
        expect(screen.getByText('Delete this note? This cannot be undone.')).toBeTruthy();
    });

    it('keeps the note when the confirmation is declined', () => {
        const remove = jest.fn().mockResolvedValue(undefined);
        renderWithDelete(remove);

        fireEvent.press(screen.getByLabelText('Delete note'));
        fireEvent.press(screen.getByLabelText('Keep note'));

        expect(remove).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Delete note permanently')).toBeNull();
        expect(screen.getByLabelText('Delete note')).toBeTruthy();
    });

    it('deletes and closes once the confirmation is taken', async () => {
        const remove = jest.fn().mockResolvedValue(undefined);
        const close = jest.fn();
        renderWithDelete(remove, close);

        fireEvent.press(screen.getByLabelText('Delete note'));
        await act(async () => { fireEvent.press(screen.getByLabelText('Delete note permanently')); });

        expect(remove).toHaveBeenCalledWith('note-1');
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('holds the note open and says so when the delete fails', async () => {
        const remove = jest.fn().mockRejectedValue(new Error('Unable to delete note right now.'));
        const close = jest.fn();
        renderWithDelete(remove, close);

        fireEvent.press(screen.getByLabelText('Delete note'));
        await act(async () => { fireEvent.press(screen.getByLabelText('Delete note permanently')); });

        expect(close).not.toHaveBeenCalled();
        expect(screen.getByText('Unable to delete note right now.')).toBeTruthy();
        // Back to the resting state, so a retry is a deliberate two presses
        // again rather than one press away from a second attempt.
        expect(screen.getByLabelText('Delete note')).toBeTruthy();
    });

    it('is absent while editing, where cancel and save own the row', () => {
        renderWithDelete(jest.fn());

        fireEvent.press(screen.getByLabelText('Edit note'));

        expect(screen.queryByLabelText('Delete note')).toBeNull();
    });

    it('is absent entirely when no delete handler is supplied', () => {
        renderModal();

        expect(screen.queryByLabelText('Delete note')).toBeNull();
    });
});
