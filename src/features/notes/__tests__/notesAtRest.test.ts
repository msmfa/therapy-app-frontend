import { describe, beforeEach, expect, it, jest } from '@jest/globals';

/**
 * End-to-end check that what actually lands in the notes table is ciphertext.
 *
 * The crypto module has its own unit tests; this exercises the storage path,
 * which is where a plaintext leak would actually happen.
 */
type Row = {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
  remindAt: number | null;
  notifId: string | null;
};

const mockRows: Row[] = [];
const mockKeychain = new Map<string, string>();

// Minimal stand-in for the handful of SQL shapes useNotes issues.
const mockDb = {
  execAsync: jest.fn(async () => undefined),
  runAsync: jest.fn(async (sql: string, ...args: unknown[]) => {
    if (sql.includes('INSERT INTO notes')) {
      const [id, userId, text, createdAt] = args as [string, string, string, number];
      if (mockRows.some((r) => r.id === id)) {
        throw new Error('UNIQUE constraint failed: notes.id');
      }
      mockRows.push({ id, userId, text, createdAt, remindAt: null, notifId: null });
      return undefined;
    }

    if (sql.includes('UPDATE notes SET text = ?')) {
      const [text, id, userId] = args as [string, string, string];
      const row = mockRows.find((r) => r.id === id && r.userId === userId);
      if (row) row.text = text;
      return undefined;
    }

    return undefined;
  }),
  getAllAsync: jest.fn(async (_sql: string, ...args: unknown[]) => {
    const [userId] = args as [string];
    return mockRows.filter((r) => r.userId === userId);
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDb),
}));

jest.mock('../../../services/notifications', () => ({
  cancelNotificationById: jest.fn(async () => undefined),
}));

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(async (key: string) => mockKeychain.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockKeychain.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockKeychain.delete(key);
  }),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn((length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = (i * 53 + length * 17 + mockRows.length * 3) % 256;
    }
    return bytes;
  }),
}));

import { encryptNoteText, decryptNoteText, isEncrypted, resetNoteKeyCache } from '../noteCrypto';
import { migratePlaintextNotes } from '../useNotes';

const SENSITIVE = 'Relapse on Thursday. Discussed self-harm urges with Dr. Patel.';

describe('notes at rest', () => {
  beforeEach(() => {
    mockRows.length = 0;
    mockKeychain.clear();
    resetNoteKeyCache();
    jest.clearAllMocks();
  });

  it('never writes the note body to the table in the clear', async () => {
    const sealed = await encryptNoteText(SENSITIVE);
    await mockDb.runAsync(
      'INSERT INTO notes (id, userId, text, createdAt) VALUES (?, ?, ?, ?)',
      'n1',
      'user-1',
      sealed,
      Date.now(),
    );

    const stored = mockRows[0].text;
    expect(stored).not.toContain('Relapse');
    expect(stored).not.toContain('self-harm');
    expect(stored).not.toContain('Patel');
    expect(isEncrypted(stored)).toBe(true);

    // ...and it still reads back correctly.
    expect(await decryptNoteText(stored)).toBe(SENSITIVE);
  });

  it('migrates rows written before encryption existed', async () => {
    mockRows.push(
      {
        id: 'legacy-1',
        userId: 'user-1',
        text: SENSITIVE,
        createdAt: 1,
        remindAt: null,
        notifId: null,
      },
      {
        id: 'legacy-2',
        userId: 'user-1',
        text: 'second plaintext note',
        createdAt: 2,
        remindAt: null,
        notifId: null,
      },
    );

    const migrated = await migratePlaintextNotes(mockDb as never, 'user-1');

    expect(migrated).toBe(2);
    for (const row of mockRows) {
      expect(isEncrypted(row.text)).toBe(true);
      expect(row.text).not.toContain('plaintext');
    }
    expect(await decryptNoteText(mockRows[0].text)).toBe(SENSITIVE);
    expect(await decryptNoteText(mockRows[1].text)).toBe('second plaintext note');
  });

  it('leaves already-encrypted rows alone on a second pass', async () => {
    mockRows.push({
      id: 'legacy-1',
      userId: 'user-1',
      text: SENSITIVE,
      createdAt: 1,
      remindAt: null,
      notifId: null,
    });

    expect(await migratePlaintextNotes(mockDb as never, 'user-1')).toBe(1);
    const afterFirst = mockRows[0].text;

    // Re-running must be a no-op, not a double-encryption.
    expect(await migratePlaintextNotes(mockDb as never, 'user-1')).toBe(0);
    expect(mockRows[0].text).toBe(afterFirst);
    expect(await decryptNoteText(mockRows[0].text)).toBe(SENSITIVE);
  });

  it('does not touch another user\'s rows', async () => {
    mockRows.push({
      id: 'other-1',
      userId: 'user-2',
      text: 'someone else note',
      createdAt: 1,
      remindAt: null,
      notifId: null,
    });

    expect(await migratePlaintextNotes(mockDb as never, 'user-1')).toBe(0);
    expect(mockRows[0].text).toBe('someone else note');
  });
});
