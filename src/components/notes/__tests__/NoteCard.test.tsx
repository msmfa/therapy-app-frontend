import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { NoteCard } from '../NoteCard';
import type { Note } from '../../../features/notes/useNotes';

const note = (overrides: Partial<Note> = {}): Note => ({
    id: 'note-1',
    text: 'I mentioned almost in passing that I have been sleeping better since I stopped checking the clock at night.',
    createdAt: new Date('2026-08-31T19:15:00Z').getTime(),
    ...overrides,
});

describe('NoteCard', () => {
    it("gives VoiceOver the card's date, time and a preview of the note, since the card carries no label of its own otherwise", () => {
        render(<NoteCard item={ note() } index={ 0 } onPress={ jest.fn() } />);

        const card = screen.getByRole('button');
        const label = card.props.accessibilityLabel as string;
        expect(label).toContain('Monday');
        expect(label).toContain('I mentioned almost in passing');
    });

    it('truncates a long note in the label rather than reading the whole thing on every list stop', () => {
        const longText = 'x'.repeat(300);
        render(<NoteCard item={ note({ text: longText }) } index={ 0 } onPress={ jest.fn() } />);

        const label = screen.getByRole('button').props.accessibilityLabel as string;
        expect(label.length).toBeLessThan(200);
        expect(label).toContain('…');
    });

    it('hides the decorative open-note icon from the accessibility tree, since it duplicates the card\'s own action', () => {
        render(<NoteCard item={ note() } index={ 0 } onPress={ jest.fn() } />);

        // Only the card itself should be a VoiceOver stop; the icon inside it
        // sits under an accessibilityElementsHidden wrapper and must not add a
        // second, separately-focusable "Open note" button.
        expect(screen.queryAllByRole('button')).toHaveLength(1);
    });
});
