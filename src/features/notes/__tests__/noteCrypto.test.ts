import { describe, beforeEach, expect, it, jest } from '@jest/globals';

const mockKeychain = new Map<string, string>();

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
    // Deterministic only so tests are reproducible; production uses the
    // platform CSPRNG.
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = (i * 37 + length * 11 + mockKeychain.size * 5) % 256;
    }
    return bytes;
  }),
}));

import * as SecureStore from 'expo-secure-store';
import {
  encryptNoteText,
  decryptNoteText,
  isEncrypted,
  getNoteKey,
  resetNoteKeyCache,
} from '../noteCrypto';

describe('note encryption', () => {
  beforeEach(() => {
    mockKeychain.clear();
    resetNoteKeyCache();
    jest.clearAllMocks();
  });

  it('round-trips a note body', async () => {
    const plaintext = 'Discussed the panic attack on Tuesday. Homework: breathing.';

    const sealed = await encryptNoteText(plaintext);
    expect(sealed).not.toContain('panic');
    expect(isEncrypted(sealed)).toBe(true);

    expect(await decryptNoteText(sealed)).toBe(plaintext);
  });

  it('round-trips unicode and emoji intact', async () => {
    const plaintext = 'Ça va mieux 🙂 — 進歩している';
    expect(await decryptNoteText(await encryptNoteText(plaintext))).toBe(plaintext);
  });

  it('round-trips an empty note', async () => {
    expect(await decryptNoteText(await encryptNoteText(''))).toBe('');
  });

  it('produces a different ciphertext each time for the same input', async () => {
    // A fixed nonce would leak that two notes are identical.
    const first = await encryptNoteText('same text');
    mockKeychain.set('__nudge', 'x'); // vary the stubbed RNG
    const second = await encryptNoteText('same text');

    expect(first).not.toBe(second);
    expect(await decryptNoteText(first)).toBe('same text');
    expect(await decryptNoteText(second)).toBe('same text');
  });

  it('rejects a tampered ciphertext rather than returning garbage', async () => {
    const sealed = await encryptNoteText('sensitive');
    const [prefix, nonce, payload] = sealed.split(':');

    // Flip a character in the payload.
    const flipped = payload[0] === 'A' ? `B${payload.slice(1)}` : `A${payload.slice(1)}`;
    const tampered = [prefix, nonce, flipped].join(':');

    await expect(decryptNoteText(tampered)).rejects.toThrow();
  });

  it('rejects a malformed envelope', async () => {
    await expect(decryptNoteText('enc.v1:onlyonepart')).rejects.toThrow(
      /Malformed encrypted note envelope/,
    );
  });

  it('passes legacy plaintext through untouched', async () => {
    const legacy = 'a note written before encryption existed';
    expect(isEncrypted(legacy)).toBe(false);
    expect(await decryptNoteText(legacy)).toBe(legacy);
  });

  it('stores the key device-only and never syncing', async () => {
    await getNoteKey();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'notes.encryptionKey.v1',
      expect.any(String),
      expect.objectContaining({
        keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
      }),
    );
  });

  it('creates the key once and reuses it', async () => {
    const first = await getNoteKey();
    const second = await getNoteKey();

    expect(first).toBe(second);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('does not create two keys when callers race', async () => {
    const [a, b, c] = await Promise.all([getNoteKey(), getNoteKey(), getNoteKey()]);

    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('reuses a key already in the keychain across a cold start', async () => {
    const sealed = await encryptNoteText('persisted across launches');

    // Simulate a fresh process: caches gone, keychain intact.
    resetNoteKeyCache();

    expect(await decryptNoteText(sealed)).toBe('persisted across launches');
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('refuses to silently replace a malformed stored key', async () => {
    mockKeychain.set('notes.encryptionKey.v1', 'dG9vLXNob3J0');
    resetNoteKeyCache();

    await expect(getNoteKey()).rejects.toThrow(/malformed/i);
  });
});
