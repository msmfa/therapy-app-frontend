import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { recoverAccountNotes } from '../../src/features/notes/recoverAccountNotes';

let mockOwner: string | undefined = '222222222222222222222222';
let mockError: string | null = null;
let mockNotes: { id: string; text: string; createdAt: number }[] = [];
const mockRefresh = jest.fn(async () => undefined);
const mockAlert = jest.fn();
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../src/context/auth/AuthContext', () => ({ useAuth: () => ({ user: mockOwner ? { id: mockOwner } : null }) }));
jest.mock('../../src/features/notes/useNotes', () => ({ useNotes: () => ({ notes: mockNotes, loading: false, error: mockError, refresh: mockRefresh, updateNote: jest.fn(), deleteNote: jest.fn() }) }));
jest.mock('../../src/features/notes/recoverAccountNotes', () => ({ recoverAccountNotes: jest.fn() }));
jest.mock('../../src/features/reviews', () => ({ useNoteReviews: () => ({ reviews: [], reviewState: jest.fn(), markReviewed: jest.fn(), progressFor: jest.fn() }) }));
jest.mock('../../src/context/alert', () => ({ useAppAlert: () => ({ showAlert: mockAlert }) }));
jest.mock('../../src/components/widgets/WidgetGuide', () => ({ WidgetDiscoveryCard: () => null }));
jest.mock('../../src/features/widgets/useWidgetDiscovery', () => ({ useWidgetDiscovery: () => ({ visible: false }) }));
jest.mock('../../src/components/notes/NotesListScreen', () => {
    const { Text, Pressable } = require('react-native');
    return ({ notes, onRecoverNotes, recoveringNotes }: { notes: unknown[]; onRecoverNotes: () => void; recoveringNotes: boolean }) => <>
        <Text>{notes.length ? 'Saved notes list' : 'Empty notes'}</Text>
        <Pressable disabled={recoveringNotes} onPress={onRecoverNotes}><Text>Find saved notes</Text></Pressable>
    </>;
});
import NotesScreen from '../(tabs)/notes';

beforeEach(() => {
    jest.clearAllMocks();
    mockOwner = '222222222222222222222222';
    mockError = null;
    mockNotes = [];
});

it('keeps a failed database read distinct from an empty notebook and offers retry', () => {
    mockError = 'Failed to load notes';
    const view = render(<NotesScreen />);
    expect(view.queryByText('Empty notes')).toBeNull();
    fireEvent.press(view.getByText('Try again'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
});

it('refreshes after a recovery and reports the number found', async () => {
    jest.mocked(recoverAccountNotes).mockResolvedValue(3);
    const view = render(<NotesScreen />);
    fireEvent.press(view.getByText('Find saved notes'));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockAlert).toHaveBeenCalledWith('Saved notes', '3 saved notes are available again.');
});

it('reports no matches without claiming notes have been deleted', async () => {
    jest.mocked(recoverAccountNotes).mockResolvedValue(0);
    const view = render(<NotesScreen />);
    fireEvent.press(view.getByText('Find saved notes'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Saved notes', expect.stringContaining('No additional notes were found')));
});

it('keeps recovery retryable after a network or storage failure', async () => {
    jest.mocked(recoverAccountNotes).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(1);
    const view = render(<NotesScreen />);
    fireEvent.press(view.getByText('Find saved notes'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Saved notes', expect.stringContaining('try again')));
    fireEvent.press(view.getByText('Find saved notes'));
    await waitFor(() => expect(mockAlert).toHaveBeenCalledWith('Saved notes', '1 saved note is available again.'));
});

it('invalidates recovery on logout and does not refresh or report success for another account', async () => {
    let finish!: (value: number) => void;
    let stillCurrent!: () => boolean;
    jest.mocked(recoverAccountNotes).mockImplementation(async (_owner, guard) => {
        stillCurrent = guard;
        return new Promise(resolve => { finish = resolve; });
    });
    const view = render(<NotesScreen />);
    fireEvent.press(view.getByText('Find saved notes'));
    expect(stillCurrent()).toBe(true);
    view.unmount();
    expect(stillCurrent()).toBe(false);
    await act(async () => finish(2));
    expect(mockAlert).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
});
