import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockDb = {
    execAsync: jest.fn(async () => undefined),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => ({ count: 1 })),
    runAsync: jest.fn(),
};
let mockEpoch = 0;
const mockSaved = jest.fn();
const mockFailed = jest.fn();
const mockBegin = jest.fn(() => {
    const epoch = mockEpoch;
    return { noteSaved: (...args: unknown[]) => { if (epoch === mockEpoch) mockSaved(...args); },
        failed: (...args: unknown[]) => { if (epoch === mockEpoch) mockFailed(...args); } };
});
jest.mock('../../analytics/engagement', () => ({ beginEngagement: () => mockBegin() }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => { await Promise.resolve(); return mockDb; }) }));
jest.mock('../noteCrypto', () => ({
    encryptNoteText: jest.fn(async () => 'encrypted-note'), decryptNoteText: jest.fn(async () => ''), isEncrypted: () => true,
}));
jest.mock('../../../services/notifications', () => ({ cancelNotificationById: jest.fn() }));

import { useNotes } from '../useNotes';

beforeEach(() => {
    jest.clearAllMocks();
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    mockEpoch += 1;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

it('reports new notes only after a successful encrypted insert and never while hydrating', async () => {
    const { result } = renderHook(() => useNotes('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSaved).not.toHaveBeenCalled();
    let finish!: () => void;
    mockDb.runAsync.mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve({ changes: 1 }); }));
    let save!: Promise<void>;
    act(() => { save = result.current.addNote('Private therapy content'); });
    await waitFor(() => expect(mockDb.runAsync).toHaveBeenCalled());
    expect(mockBegin).toHaveBeenCalledTimes(1);
    expect(mockSaved).not.toHaveBeenCalled();
    await act(async () => { finish(); await save; });

    expect(mockSaved).toHaveBeenCalledWith(expect.any(String), 'new', expect.any(Function));
    expect(JSON.stringify(mockSaved.mock.calls)).not.toContain('Private therapy content');
    expect(await mockSaved.mock.calls[0][2]()).toBe(true);
});

it('reports persisted text edits but not reminder metadata changes', async () => {
    const { result } = renderHook(() => useNotes('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateNote('note-1', { text: 'Revised private text' }); });
    expect(mockSaved).toHaveBeenCalledWith('note-1', 'edit', expect.any(Function));
    await act(async () => { await result.current.updateNote('note-1', { remindAt: 123 }); });
    expect(mockSaved).toHaveBeenCalledTimes(1);
});

it.each(['rejected', 'zero_rows'] as const)('does not report a saved edit when persistence returns %s', async (failure) => {
    const { result } = renderHook(() => useNotes('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    if (failure === 'rejected') mockDb.runAsync.mockRejectedValueOnce(new Error('private database details'));
    else mockDb.runAsync.mockResolvedValueOnce({ changes: 0 });
    await act(async () => { await expect(result.current.updateNote('missing-note', { text: 'Still unsaved' })).rejects.toThrow('Unable to update note'); });
    expect(mockSaved).not.toHaveBeenCalled();
    expect(mockFailed).toHaveBeenCalledWith('note_save');
    expect(JSON.stringify(mockFailed.mock.calls)).not.toMatch(/private|Still unsaved|missing-note/);
});

it('does not assign a late account A save to account B', async () => {
    const { result, rerender } = renderHook(({ user }) => useNotes(user), { initialProps: { user: 'user-a' } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let finish!: () => void;
    mockDb.runAsync.mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve({ changes: 1 }); }));
    let save!: Promise<void>;
    act(() => { save = result.current.addNote('Account A private note'); });
    await waitFor(() => expect(mockDb.runAsync).toHaveBeenCalled());
    mockEpoch += 1;
    rerender({ user: 'user-b' });
    await act(async () => { finish(); await save; });
    expect(mockSaved).not.toHaveBeenCalled();
});
