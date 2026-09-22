/**
 * Where the appearance choice lives.
 *
 * AsyncStorage, beside the language preference: an appearance choice is not a
 * secret and has no business in expo-secure-store. Per install rather than per
 * account, because it is a property of the device in the hand and the light
 * it is being read in, not of who is signed in.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'settings:theme';

export const SYSTEM_THEME = 'system';

/** What the user chose. `'system'` is a choice, not the absence of one. */
export type ThemePreference = typeof SYSTEM_THEME | 'light' | 'dark';

const PREFERENCES: readonly ThemePreference[] = [SYSTEM_THEME, 'light', 'dark'];

export const parseThemePreference = (value: unknown): ThemePreference =>
    PREFERENCES.find((preference) => preference === value) ?? SYSTEM_THEME;

/**
 * The stored preference, or `'system'` if nothing is stored or the read fails.
 *
 * A storage failure must not stop the app booting, so it degrades to following
 * the device rather than propagating.
 */
export const readThemePreference = async (): Promise<ThemePreference> => {
    try {
        return parseThemePreference(await AsyncStorage.getItem(STORAGE_KEY));
    } catch {
        return SYSTEM_THEME;
    }
};

/** Persist a choice. Throws if the write fails, so callers can tell the user. */
export const writeThemePreference = async (preference: ThemePreference): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEY, preference);
};
