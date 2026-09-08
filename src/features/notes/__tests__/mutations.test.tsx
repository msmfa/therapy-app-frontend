import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockDb = {
    execAsync: jest.fn(async () => undefined),
    getAllAsync: jest.fn(async () => []),
    runAsync: jest.fn(),
};
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(async () => { await Promise.resolve(); return mockDb; }),
}));
jest.mock('../noteCrypto', () => ({
    encryptNoteText: jest.fn(async () => 'enc.v1:nonce:ciphertext'),
    decryptNoteText: jest.fn(async () => ''),
    isEncrypted: jest.fn(() => true),
}));
jest.mock('../../../services/notifications', () => ({ cancelNotificationById: jest.fn() }));

import { useNotes } from '../useNotes';
import { encryptNoteText } from '../noteCrypto';

beforeEach(() => {
    jest.clearAllMocks();
    mockDb.runAsync.mockResolvedValue({ changes: 1 });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

it.each([
    ['add', 'sqlite'], ['add', 'encryption'],
    ['update', 'sqlite'], ['update', 'encryption'],
] as const)('rejects a failed %s caused by %s so the editor can retain its draft', async (operation, failure) => {
    const { result } = renderHook(() => useNotes('user-a'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    if (failure === 'sqlite') mockDb.runAsync.mockRejectedValueOnce(new Error('disk full'));
    else jest.mocked(encryptNoteText).mockRejectedValueOnce(new Error('keychain unavailable'));

    await act(async () => {
        const write = operation === 'add'
            ? result.current.addNote('Unsaved private note')
            : result.current.updateNote('note-1', { text: 'Unsaved edit' });
        await expect(write).rejects.toThrow(operation === 'add' ? 'Unable to save note' : 'Unable to update note');
    });

    expect(result.current.notes).toEqual([]);
    expect(result.current.error).not.toBeNull();
});
