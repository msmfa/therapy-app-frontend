/**
 * Where the language choice lives.
 *
 * AsyncStorage, matching the onboarding draft, the reminders cache and the
 * analytics modules. A language preference is not a secret and has no business
 * in expo-secure-store, which is reserved here for auth tokens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { parsePreference, SYSTEM_PREFERENCE, type LanguagePreference } from './resolve';

const STORAGE_KEY = 'settings:language';

/**
 * The stored preference, or `'system'` if nothing is stored or the read fails.
 *
 * A storage failure must not stop the app booting, so it degrades to following
 * the device rather than propagating.
 */
export const readLanguagePreference = async (): Promise<LanguagePreference> => {
    try {
        return parsePreference(await AsyncStorage.getItem(STORAGE_KEY));
    } catch {
        return SYSTEM_PREFERENCE;
    }
};

/** Persist a choice. Throws if the write fails, so callers can tell the user. */
export const writeLanguagePreference = async (preference: LanguagePreference): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
};
