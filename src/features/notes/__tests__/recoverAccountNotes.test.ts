import { getCurrentUserSettings } from '../../../api/users';
import { getNotesDb } from '../useNotes';
import { migrateVerifiedNoteOwners, recoverAccountNotes } from '../recoverAccountNotes';

jest.mock('../../../api/users', () => ({ getCurrentUserSettings: jest.fn() }));
jest.mock('../useNotes', () => ({ getNotesDb: jest.fn() }));
jest.mock('../../widgets/progressEvents', () => ({ notifyProgressChanged: jest.fn() }));

const oldId = '111111111111111111111111';
const currentId = '222222222222222222222222';
const otherId = '333333333333333333333333';
type Row = { id: string; userId: string; text: string; createdAt: number; notifId: string };
let notes: Row[];
let reviews: { noteId: string; userId: string; localDate: string }[];
let audit: unknown[][];
const runAsync = jest.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.startsWith('INSERT OR IGNORE')) {
        notes.filter(n => n.userId === args[2]).forEach(n => audit.push([n.id, n.userId, args[0]]));
        return { changes: 0 };
    }
    if (sql.startsWith('UPDATE note_reviews')) {
        reviews.forEach(r => { if (r.userId === args[1] && notes.some(n => n.id === r.noteId && n.userId === args[2])) r.userId = args[0] as string; });
        return { changes: 0 };
    }
    if (sql.startsWith('UPDATE notes')) {
        let changes = 0;
        notes.forEach(n => { if (n.userId === args[1]) { n.userId = args[0] as string; changes++; } });
        return { changes };
    }
    throw new Error('Unexpected SQL');
});
const db = {
    withExclusiveTransactionAsync: jest.fn(async (body: (tx: unknown) => Promise<void>) => {
        const backup = JSON.stringify({ notes, reviews, audit });
        try { await body({ execAsync: jest.fn(), runAsync }); }
        catch (error) { ({ notes, reviews, audit } = JSON.parse(backup)); throw error; }
    }),
};

beforeEach(() => {
    jest.clearAllMocks();
    notes = [oldId, currentId, otherId].map((userId, index) => ({ id: `note-${index}`, userId, text: 'enc.v1:nonce:ciphertext', createdAt: 123 + index, notifId: `notification-${index}` }));
    reviews = notes.map(n => ({ noteId: n.id, userId: n.userId, localDate: '2026-09-20' }));
    audit = [];
    jest.mocked(getNotesDb).mockResolvedValue(db as never);
    jest.mocked(getCurrentUserSettings).mockResolvedValue({ id: currentId, localNoteRecoveryUserIds: [oldId] });
});

it('recovers only verified former owners, preserving ciphertext, dates, note IDs, notifications and reviews', async () => {
    const before = JSON.parse(JSON.stringify(notes));
    expect(await recoverAccountNotes(currentId, () => true)).toBe(1);
    expect(notes[0]).toEqual({ ...before[0], userId: currentId });
    expect(notes.slice(1)).toEqual(before.slice(1));
    expect(reviews).toEqual([
        { noteId: 'note-0', userId: currentId, localDate: '2026-09-20' },
        { noteId: 'note-1', userId: currentId, localDate: '2026-09-20' },
        { noteId: 'note-2', userId: otherId, localDate: '2026-09-20' },
    ]);
    expect(audit).toEqual([['note-0', oldId, currentId]]);
    expect(await recoverAccountNotes(currentId, () => true)).toBe(0);
    expect(notes).toHaveLength(3);
});

it.each(['different-account', 'signed-out', 'malformed-alias'] as const)('rejects %s before opening or changing local data', async (failure) => {
    jest.mocked(getCurrentUserSettings).mockResolvedValue({ id: failure === 'different-account' ? otherId : currentId, localNoteRecoveryUserIds: failure === 'malformed-alias' ? [null as never] : [oldId] });
    await expect(recoverAccountNotes(currentId, () => failure !== 'signed-out')).rejects.toThrow();
    expect(getNotesDb).not.toHaveBeenCalled();
    expect(runAsync).not.toHaveBeenCalled();
});

it('does not adopt arbitrary notes when the server has no verified former identity', async () => {
    jest.mocked(getCurrentUserSettings).mockResolvedValue({ id: currentId, localNoteRecoveryUserIds: [] });
    expect(await recoverAccountNotes(currentId, () => true)).toBe(0);
    expect(getNotesDb).not.toHaveBeenCalled();
});

it('rolls back notes, reviews and the journal if storage fails', async () => {
    const before = JSON.stringify({ notes, reviews, audit });
    runAsync.mockImplementationOnce(async () => { throw new Error('disk full'); });
    await expect(recoverAccountNotes(currentId, () => true)).rejects.toThrow('disk full');
    expect(JSON.stringify({ notes, reviews, audit })).toBe(before);
    expect(await recoverAccountNotes(currentId, () => true)).toBe(1);
});

it('rolls back when the account changes during the transaction', async () => {
    const before = JSON.stringify({ notes, reviews, audit });
    let checks = 0;
    await expect(migrateVerifiedNoteOwners(db as never, currentId, [oldId], () => ++checks < 3)).rejects.toThrow('Account changed');
    expect(JSON.stringify({ notes, reviews, audit })).toBe(before);
});

it('rejects an invalid server alias without starting a transaction', async () => {
    await expect(migrateVerifiedNoteOwners(db as never, currentId, ['not-an-account'], () => true)).rejects.toThrow();
    expect(db.withExclusiveTransactionAsync).not.toHaveBeenCalled();
});
