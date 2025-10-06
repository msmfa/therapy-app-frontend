import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => {
    const React = require('react');
    return {
        useRouter: () => ({
            replace: mockReplace,
        }),
        useFocusEffect: (callback: any) => {
            const { useEffect } = React;
            useEffect(() => callback(), [callback]);
        },
    };
});

jest.mock('../../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
        isAuthenticated: true,
        hydrated: true,
    }),
}));

jest.mock('../../../src/components/notes/EmptyNotesScreen', () => {
    const React = require('react');
    const { Text } = require('react-native');

    return function EmptyNotesScreen() {
        return <Text testID="empty-notes-placeholder">No notes yet</Text>;
    };
});

jest.mock('../../../src/components/notes/NotesListScreen', () => {
    const React = require('react');
    const { View, Text } = require('react-native');

    return function NotesListScreen({ notes }: { notes: Array<{ id: string; text: string }> }) {
        return (
            <View accessibilityLabel="notes-list">
                { notes.map((note) => (
                    <Text key={ note.id }>{ note.text }</Text>
                )) }
            </View>
        );
    };
});

jest.mock('../../../src/hooks/useNotes', () => {
    const React = require('react');

    let notesStore: any[] = [];
    const mockListeners = new Set();

    const snapshot = () => notesStore.map((note) => ({ ...note }));
    const emit = () => {
        const next = snapshot();
        mockListeners.forEach((listener) => listener(next));
    };

    const subscribe = (listener: any) => {
        mockListeners.add(listener);
        listener(snapshot());
        return () => {
            mockListeners.delete(listener);
        };
    };

    const addNote = jest.fn(async (text: string) => {
        const clean = text.trim();
        if (!clean) return;

        const now = Date.now();
        notesStore = [{ id: String(now), text: clean, createdAt: now }, ...notesStore];
        emit();
    });

    const refresh = jest.fn(async () => {
        emit();
    });

    const updateNote = jest.fn();

    function useNotes() {
        const { useEffect, useState } = React;
        const [notes, setNotes] = useState(() => snapshot());

        useEffect(() => subscribe(setNotes), []);

        return {
            notes,
            loading: false,
            error: null,
            refresh,
            addNote,
            updateNote,
        };
    }

    return {
        useNotes,
        __resetNotesStore: () => {
            notesStore = [];
            emit();
            addNote.mockClear();
            refresh.mockClear();
            updateNote.mockClear();
        },
        __getMocks: () => ({ addNote, refresh, updateNote }),
    };
});

const notesModule = require('../../../src/hooks/useNotes') as {
    __resetNotesStore: () => void;
    __getMocks: () => {
        addNote: jest.Mock;
        refresh: jest.Mock;
        updateNote: jest.Mock;
    };
};

const { __resetNotesStore, __getMocks } = notesModule;

describe('add note flow', () => {
    beforeAll(() => {
        // @ts-expect-error: provide basic RAF polyfill for the test environment
        global.requestAnimationFrame = (cb: (time: number) => void) => {
            cb(0);
            return 0;
        };
    });

    beforeEach(() => {
        __resetNotesStore();
        mockReplace.mockClear();
    });

    it('shows the newly added note on the notes screen after saving from the index screen', async () => {
        const NewNoteScreen = require('../index').default;
        const NotesScreen = require('../notes').default;

        const noteText = 'Remember to breathe deeply';

        const indexScreen = render(<NewNoteScreen />);
        const input = indexScreen.getByPlaceholderText('Add your notes here...');

        fireEvent.changeText(input, `  ${ noteText }  `);

        await act(async () => {
            fireEvent.press(indexScreen.getByTestId('add-note-button'));
        });

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/notes');
        });

        const notesScreen = render(<NotesScreen />);

        await waitFor(() => {
            expect(notesScreen.getByText(noteText)).toBeTruthy();
        });

        const { refresh } = __getMocks();
        expect(refresh).toHaveBeenCalled();
    });
});
