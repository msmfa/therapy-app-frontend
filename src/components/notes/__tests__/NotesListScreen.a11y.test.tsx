import React from 'react';
import { render, screen } from '@testing-library/react-native';
import NotesListScreen from '../NotesListScreen';
import { NoteCard } from '../NoteCard';
import { NotePreviewModal } from '../NotesListScreenModal';
import type { Note } from '../../../features/notes/useNotes';

jest.mock('@react-navigation/elements', () => ({ useHeaderHeight: () => 0 }));
jest.mock('../NoteCard', () => ({ NoteCard: jest.fn(() => null) }));
jest.mock('../NotesListScreenModal', () => ({ NotePreviewModal: jest.fn(() => null) }));
jest.mock('../ReviewProgressGallery', () => ({ ReviewProgressGallery: () => null }));
jest.mock('../EmptyNoteCard', () => ({ EmptyNoteCard: () => null }));
jest.mock('../SampleNoteCard', () => ({ SampleNoteCard: () => null }));

const note: Note = { id: 'note-1', text: 'Reflection', createdAt: 1_000 };

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(NoteCard).mockImplementation(() => <></>);
    jest.mocked(NotePreviewModal).mockImplementation(() => <></>);
});

it('gives the screen exactly one "Notes" heading, not the two PinnedHeader mounts', () => {
    render(<NotesListScreen notes={ [note] } loading={ false } refresh={ jest.fn() } onUpdateNote={ jest.fn() } />);

    // PinnedHeader renders twice by design (a real pinned copy, and an
    // invisible one that only reserves scroll space for it) — VoiceOver must
    // see just the first, or a screen this central announces its own title
    // twice on every visit.
    expect(screen.getAllByRole('header', { name: 'Notes' })).toHaveLength(1);
});
