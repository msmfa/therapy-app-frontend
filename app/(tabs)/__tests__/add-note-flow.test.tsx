/* eslint-env jest */
import { expect, describe, it, beforeEach, jest, beforeAll, afterAll } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

const mockReplace = jest.fn<(path: string) => void>();

jest.mock('expo-router', () => {
    const React = require('react') as typeof import('react');
    return {
        useRouter: () => ({
            replace: mockReplace,
        }),
        useFocusEffect: (callback: React.EffectCallback) => {
            const { useEffect } = React;
            useEffect(callback, [callback]);
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
    const React = require('react') as typeof import('react');
    const ReactNative = require('react-native') as typeof import('react-native');
    const { Text } = ReactNative;

    return function EmptyNotesScreen() {
        return <Text testID="empty-notes-placeholder">No notes yet</Text>;
    };
});

jest.mock('../../../src/components/notes/NotesListScreen', () => {
    const ReactNative = require('react-native') as typeof import('react-native');
    const { View, Text } = ReactNative;

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
    const React = require('react') as typeof import('react');

    type mockNote = { id: string; text: string; createdAt: number };
    type MockNotesListener = (mockNotes: mockNote[]) => void;

    let notesStore: mockNote[] = [];
    const mockListeners: Set<MockNotesListener> = new Set();

    const snapshot = (): mockNote[] => notesStore.map((note) => ({ ...note }));
    const emit = () => {
        const next = snapshot();
        mockListeners.forEach((listener) => listener(next));
    };

    const subscribe = (listener: MockNotesListener) => {
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

const globalWithRAF = globalThis as typeof globalThis & {
    requestAnimationFrame?: (cb: (time: number) => void) => number;
};

let originalRAF: ((cb: (time: number) => void) => number) | undefined;

describe('add note flow', () => {
    beforeAll(() => {
        originalRAF = globalWithRAF.requestAnimationFrame;
        globalWithRAF.requestAnimationFrame = (cb: (time: number) => void) => {
            cb(0);
            return 0;
        };
    });

    afterAll(() => {
        if (originalRAF) {
            globalWithRAF.requestAnimationFrame = originalRAF;
        } else {
            Reflect.deleteProperty(globalWithRAF, 'requestAnimationFrame');
        }
    });

    beforeEach(() => {
        __resetNotesStore();
        mockReplace.mockClear();
    });

    it('shows the newly added note on the notes screen after saving from the index screen', async () => {
        const { default: NewNoteScreen } = require('../index') as typeof import('../index');
        const { default: NotesScreen } = require('../notes') as typeof import('../notes');

        const noteText = 'Remember to breathe deeply';

        const indexScreen = render(<NewNoteScreen />);
        const input = indexScreen.getByPlaceholderText('Add your notes here...');

        fireEvent.changeText(input, `  ${ noteText }  `);

        await act(async () => {
            fireEvent.press(indexScreen.getByTestId('add-note-button'));
        });

        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/notes');

        indexScreen.unmount();

        const notesScreen = render(<NotesScreen />);

        expect(notesScreen.getByText(noteText)).toBeTruthy();

        const { refresh } = __getMocks();
        expect(refresh).toHaveBeenCalled();

        notesScreen.unmount();
    });
});
