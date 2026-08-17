import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';

/**
 * Encryption at rest for therapy notes.
 *
 * Note bodies are special-category health data (GDPR Art. 9) and were being
 * written to `notes.db` in plaintext, readable by anything with filesystem
 * access to the app container — a jailbroken device, a forensic extraction,
 * or an unencrypted device backup.
 *
 * The cipher is AES-256-GCM (authenticated, so tampering is detected rather
 * than silently decrypted). React Native ships no WebCrypto and expo-sqlite
 * has no SQLCipher build, so the primitive comes from @noble/ciphers — pure
 * JS, audited, zero-dependency — and all randomness comes from expo-crypto,
 * which is backed by the platform CSPRNG. The library's own PRNG is never
 * used.
 *
 * Only the note body is encrypted. Timestamps and notification ids stay in
 * the clear because the app sorts and queries on them; they are metadata, not
 * content.
 */

const KEY_STORE_KEY = 'notes.encryptionKey.v1';
// ':' cannot appear in base64, so it is a safe separator. A '.' is not: the
// version prefix contains one, which silently misaligned the split.
const ENVELOPE_PREFIX = 'enc.v1';
const ENVELOPE_SEP = ':';
const KEY_BYTES = 32; // AES-256
const NONCE_BYTES = 12; // GCM standard

let cachedKey: Uint8Array | null = null;
let keyLoad: Promise<Uint8Array> | null = null;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return global.btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = global.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * The key never leaves the device and is excluded from iCloud Keychain and
 * device backups. Notes are local-only, so a key that cannot be restored is
 * the right tradeoff: it means a stolen backup is not a stolen diary.
 */
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function loadOrCreateKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(KEY_STORE_KEY, KEYCHAIN_OPTIONS);

  if (existing) {
    const decoded = fromBase64(existing);
    if (decoded.length === KEY_BYTES) {
      return decoded;
    }
    // A short or corrupt key cannot decrypt anything already written, and
    // silently replacing it would orphan those notes. Surface it instead.
    throw new Error('Stored note encryption key is malformed');
  }

  const created = Crypto.getRandomBytes(KEY_BYTES);
  await SecureStore.setItemAsync(KEY_STORE_KEY, toBase64(created), KEYCHAIN_OPTIONS);
  return created;
}

export async function getNoteKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  // Deduplicated: several notes decrypting at once must not race to create
  // two different keys.
  if (!keyLoad) {
    keyLoad = loadOrCreateKey()
      .then((key) => {
        cachedKey = key;
        return key;
      })
      .finally(() => {
        keyLoad = null;
      });
  }

  return keyLoad;
}

/** Test seam; also used when a user's data is wiped. */
export function resetNoteKeyCache(): void {
  cachedKey = null;
  keyLoad = null;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(`${ENVELOPE_PREFIX}${ENVELOPE_SEP}`);
}

export async function encryptNoteText(plaintext: string): Promise<string> {
  const key = await getNoteKey();
  const nonce = Crypto.getRandomBytes(NONCE_BYTES);
  const sealed = gcm(key, nonce).encrypt(new TextEncoder().encode(plaintext));

  return [ENVELOPE_PREFIX, toBase64(nonce), toBase64(sealed)].join(ENVELOPE_SEP);
}

/**
 * Rows written before encryption existed are returned unchanged, so reading
 * keeps working while the migration catches up.
 */
export async function decryptNoteText(stored: string): Promise<string> {
  if (!isEncrypted(stored)) {
    return stored;
  }

  const [, nonceB64, payloadB64] = stored.split(ENVELOPE_SEP);
  if (!nonceB64 || !payloadB64) {
    throw new Error('Malformed encrypted note envelope');
  }

  const key = await getNoteKey();
  const opened = gcm(key, fromBase64(nonceB64)).decrypt(fromBase64(payloadB64));

  return new TextDecoder().decode(opened);
}
