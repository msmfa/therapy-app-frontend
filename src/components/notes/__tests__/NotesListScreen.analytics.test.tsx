import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import NotesListScreen from '../NotesListScreen';
import { NoteCard } from '../NoteCard';
import { NotePreviewModal } from '../NotesListScreenModal';
import { captureNoteOpened } from '../../../features/analytics/engagement';
import type { Note } from '../../../features/notes/useNotes';

jest.mock('@react-navigation/elements', () => ({ useHeaderHeight: () => 0 }));
jest.mock('../NoteCard', () => ({ NoteCard: jest.fn(() => null) }));
jest.mock('../NotesListScreenModal', () => ({ NotePreviewModal: jest.fn(() => null) }));
jest.mock('../ReviewProgressGallery', () => ({ ReviewProgressGallery: () => null }));
jest.mock('../EmptyNoteCard', () => ({ EmptyNoteCard: () => null }));
jest.mock('../SampleNoteCard', () => ({ SampleNoteCard: () => null }));
jest.mock('../../../features/analytics/engagement', () => ({ captureNoteOpened: jest.fn() }));

const note: Note = { id: 'private-note-id', text: 'Private reflection', createdAt: 1_000 };

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NoteCard).mockImplementation(({ item, onPress }) => (
        <Pressable testID="open-note" onPress={() => onPress(item)} />
    ));
    jest.mocked(NotePreviewModal).mockImplementation(({ visible, onClose }) => (
        visible ? <Pressable testID="close-note" onPress={onClose} /> : <></>
    ));
});

it('counts intentional opens, excludes rendering and refreshes, and suppresses repeated presses while open', () => {
    const props = { notes: [note], loading: false, refresh: jest.fn(), onUpdateNote: jest.fn() };
    const { rerender } = render(<NotesListScreen {...props} />);
    expect(captureNoteOpened).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('open-note'));
    fireEvent.press(screen.getByTestId('open-note'));
    expect(captureNoteOpened).toHaveBeenCalledTimes(1);
    expect(captureNoteOpened).toHaveBeenCalledWith(note.createdAt);

    rerender(<NotesListScreen {...props} notes={[{ ...note, text: 'Updated reflection' }]} />);
    expect(captureNoteOpened).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('close-note'));
    fireEvent.press(screen.getByTestId('open-note'));
    expect(captureNoteOpened).toHaveBeenCalledTimes(2);
});
