import type { SQLiteDatabase } from 'expo-sqlite';
import { waitFor } from '@testing-library/react-native';
import { migrateReviewIdentity } from '../reviewSchema';

const mockDb = {
    execAsync: jest.fn(),
    getAllAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => mockDb) }));
jest.mock('../../notes/noteCrypto', () => ({}));
jest.mock('../../../services/notifications', () => ({}));

const database = () => mockDb as unknown as SQLiteDatabase;
const loadNotesDatabase = (): (() => Promise<SQLiteDatabase>) => {
    let getNotesDb!: () => Promise<SQLiteDatabase>;
    jest.isolateModules(() => {
        getNotesDb = (require('../../notes/useNotes') as typeof import('../../notes/useNotes')).getNotesDb;
    });
    return getNotesDb;
};

beforeEach(() => {
    jest.resetAllMocks();
    // resetAllMocks also resets the native module factory's open function.
    jest.mocked(require('expo-sqlite') as typeof import('expo-sqlite')).openDatabaseAsync.mockResolvedValue(database());
    mockDb.execAsync.mockResolvedValue(undefined);
    mockDb.getAllAsync.mockResolvedValue([{ name: 'noteId' }, { name: 'localDate' }]);
});

it('adds a nullable identity to an old table and a separate partial unique index', async () => {
    await migrateReviewIdentity(database());

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('PRAGMA table_info(note_reviews)');
    expect(mockDb.execAsync.mock.calls).toEqual([
        ['ALTER TABLE note_reviews ADD COLUMN occurrenceId TEXT;'],
        [expect.stringMatching(/CREATE UNIQUE INDEX IF NOT EXISTS[\s\S]*\(noteId, occurrenceId\) WHERE occurrenceId IS NOT NULL/)],
    ]);
});

it('retries an interrupted migration without adding the column twice', async () => {
    mockDb.execAsync.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('index write failed'));
    await expect(migrateReviewIdentity(database())).rejects.toThrow('index write failed');

    mockDb.getAllAsync.mockResolvedValue([{ name: 'noteId' }, { name: 'occurrenceId' }]);
    await expect(migrateReviewIdentity(database())).resolves.toBeUndefined();

    expect(mockDb.execAsync.mock.calls.filter(([sql]) => sql.startsWith('ALTER TABLE'))).toHaveLength(1);
    expect(mockDb.execAsync.mock.calls.filter(([sql]) => sql.startsWith('CREATE UNIQUE INDEX'))).toHaveLength(2);
});

it('makes concurrent note and review callers wait for the same completed migration', async () => {
    let finishRead!: (columns: { name: string }[]) => void;
    mockDb.getAllAsync.mockReturnValue(new Promise((resolve) => { finishRead = resolve; }));
    const getNotesDb = loadNotesDatabase();
    let completed = 0;
    const first = getNotesDb().then((db) => { completed += 1; return db; });
    const second = getNotesDb().then((db) => { completed += 1; return db; });
    await waitFor(() => expect(mockDb.getAllAsync).toHaveBeenCalledTimes(1));
    expect(completed).toBe(0);

    finishRead([{ name: 'occurrenceId' }]);
    await expect(Promise.all([first, second])).resolves.toEqual([database(), database()]);
    expect(mockDb.execAsync.mock.calls.filter(([sql]) => sql.includes('idx_note_reviews_note_occurrence'))).toHaveLength(1);
});

it('allows database initialization to recover after a schema read fails', async () => {
    mockDb.getAllAsync.mockRejectedValueOnce(new Error('storage temporarily unavailable'));
    const getNotesDb = loadNotesDatabase();

    await expect(getNotesDb()).rejects.toThrow('storage temporarily unavailable');
    await expect(getNotesDb()).resolves.toBe(database());

    expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
    expect(mockDb.execAsync.mock.calls.filter(([sql]) => sql.includes('idx_note_reviews_note_occurrence'))).toHaveLength(1);
});
