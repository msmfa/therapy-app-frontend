import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, StyleSheet, useColorScheme, View } from 'react-native';

import { darkTheme, lightTheme, themeFor, type ColorScheme, type Theme } from 'designs/designs-themes';
import {
    readThemePreference,
    SYSTEM_THEME,
    writeThemePreference,
    type ThemePreference,
} from './storage';

export type ThemeContextValue = {
    theme: Theme;
    /** The scheme actually in use, after the preference is applied. */
    scheme: ColorScheme;
    /** What the user chose. `'system'` follows the device. */
    preference: ThemePreference;
    setPreference: (next: ThemePreference) => Promise<void>;
};

const noop = async (): Promise<void> => undefined;

/**
 * Light by default, so a component rendered without a provider (every existing
 * test, a storybook, a stray preview) paints exactly what it painted before
 * the theme existed rather than throwing.
 */
const ThemeContext = createContext<ThemeContextValue>({
    theme: lightTheme,
    scheme: 'light',
    preference: SYSTEM_THEME,
    setPreference: noop,
});

const resolveScheme = (preference: ThemePreference, system: ColorScheme | null | undefined): ColorScheme =>
    preference === SYSTEM_THEME ? (system ?? 'light') : preference;

/**
 * The appearance the app is drawn in.
 *
 * The device's scheme, layered with a persisted override. Children are held
 * back until the override has been read: it is a few milliseconds behind the
 * splash, and letting the tree mount in the device's scheme first meant a
 * user who chose dark on a light phone saw every screen flash light on every
 * launch.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>(SYSTEM_THEME);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void readThemePreference().then((stored) => {
            if (cancelled) return;
            setPreferenceState(stored);
            setHydrated(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const scheme = resolveScheme(preference, systemScheme);

    // Native UI the app does not draw itself (the keyboard, date pickers, the
    // share sheet, alerts) reads the process-wide scheme, so an override has
    // to be pushed down to it or the keyboard comes up light over a dark
    // screen. `null` hands control back to the device.
    useEffect(() => {
        if (!hydrated) return;
        Appearance.setColorScheme(preference === SYSTEM_THEME ? null : preference);
    }, [hydrated, preference]);

    const setPreference = useCallback(async (next: ThemePreference) => {
        // Apply first, persist second. The switch is what the user asked for
        // and is instant; if the write fails they still get the appearance
        // they picked for this session, and the throw tells the caller to say
        // it will not be remembered.
        setPreferenceState(next);
        await writeThemePreference(next);
    }, []);

    const value = useMemo<ThemeContextValue>(() => ({
        theme: themeFor(scheme),
        scheme,
        preference,
        setPreference,
    }), [scheme, preference, setPreference]);

    if (!hydrated) {
        // The device's own ground for the frame or two before the stored
        // choice arrives, so nothing white shows between the splash and the
        // first screen.
        const holding = systemScheme === 'dark' ? darkTheme : lightTheme;
        return <View style={ [styles.holding, { backgroundColor: holding.ground.base }] } />;
    }

    return (
        <ThemeContext.Provider value={ value }>
            { children }
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}

const styles = StyleSheet.create({
    holding: {
        flex: 1,
    },
});
