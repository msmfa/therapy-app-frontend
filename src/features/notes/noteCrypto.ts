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

/**
 * UTF-8 conversion done by hand rather than with TextEncoder/TextDecoder.
 *
 * Hermes ships `TextEncoder` but *not* `TextDecoder`, and React Native does
 * not polyfill either. `new TextDecoder()` therefore threw on every device
 * read, `readRowText` swallowed it, and every encrypted note came back as an
 * empty string: notes were saved and then displayed blank. Node provides both,
 * so the unit tests passed throughout.
 *
 * Doing it here keeps the module independent of whatever the engine happens to
 * expose. Unpaired surrogates become U+FFFD, matching TextEncoder.
 */
const utf8Encode = (value: string): Uint8Array => {
  const out: number[] = [];

  for (let i = 0; i < value.length; i += 1) {
    let cp = value.charCodeAt(i);

    if (cp >= 0xd800 && cp <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        cp = ((cp - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i += 1;
      } else {
        cp = 0xfffd;
      }
    } else if (cp >= 0xdc00 && cp <= 0xdfff) {
      cp = 0xfffd;
    }

    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }

  return new Uint8Array(out);
};

const utf8Decode = (bytes: Uint8Array): string => {
  let out = '';
  let i = 0;

  while (i < bytes.length) {
    const b0 = bytes[i];
    i += 1;

    let cp: number;
    if (b0 < 0x80) {
      cp = b0;
    } else if ((b0 & 0xe0) === 0xc0) {
      cp = ((b0 & 0x1f) << 6) | (bytes[i] & 0x3f);
      i += 1;
    } else if ((b0 & 0xf0) === 0xe0) {
      cp = ((b0 & 0x0f) << 12) | ((bytes[i] & 0x3f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else {
      cp = ((b0 & 0x07) << 18)
        | ((bytes[i] & 0x3f) << 12)
        | ((bytes[i + 1] & 0x3f) << 6)
        | (bytes[i + 2] & 0x3f);
      i += 3;
    }

    if (cp > 0xffff) {
      const rest = cp - 0x10000;
      out += String.fromCharCode(0xd800 | (rest >> 10), 0xdc00 | (rest & 0x3ff));
    } else {
      out += String.fromCharCode(cp);
    }
  }

  return out;
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
  const sealed = gcm(key, nonce).encrypt(utf8Encode(plaintext));

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

  return utf8Decode(opened);
}
