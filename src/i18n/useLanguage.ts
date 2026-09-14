/**
 * The language preference, as the settings screen sees it.
 *
 * Holds the *preference* ('system' | a tag), not just the language in use.
 * The picker has to be able to show System as selected while also saying which
 * language System currently resolves to, and those are two different values.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { deviceLanguageTags, i18next } from './index';
import { endonymFor } from './languages';
import {
    resolveDeviceLanguage,
    resolveLanguage,
    SYSTEM_PREFERENCE,
    type LanguagePreference,
} from './resolve';
import { readLanguagePreference, writeLanguagePreference } from './storage';
import { updateCurrentUser } from '../api/users';

export type LanguageState = {
    /** What the user chose. `'system'` is a choice, not the absence of one. */
    preference: LanguagePreference;
    /**
     * The name, in itself, of the language System resolves to right now
     * ("Français"), for the System row's second line.
     */
    systemEndonym: string;
    setPreference: (next: LanguagePreference) => Promise<void>;
};

export const useLanguage = (): LanguageState => {
    // Subscribing to the i18next instance keeps this hook re-rendering in step
    // with every other translated component when the language changes.
    useTranslation();
    const [preference, setPreferenceState] = useState<LanguagePreference>(SYSTEM_PREFERENCE);

    useEffect(() => {
        let cancelled = false;
        void readLanguagePreference().then((stored) => {
            if (!cancelled) setPreferenceState(stored);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const setPreference = useCallback(async (next: LanguagePreference) => {
        const language = resolveLanguage(next, deviceLanguageTags());
        // Apply first, persist second. The language change is what the user
        // asked for and is instant; if the write fails they still get the UI
        // they picked for this session, and the throw tells the caller to say
        // that it will not be remembered.
        await i18next.changeLanguage(language);
        setPreferenceState(next);

        // Push copy is composed server-side, so the choice has to reach the
        // account as well as the device. `null` clears the stored choice, which
        // is how System is expressed: the server then falls back to the device
        // tag sent at registration.
        //
        // Deliberately not awaited into the failure path below. A signed-out
        // user, or an offline one, still gets the language they asked for; the
        // only cost of a failed sync is that the next push is in the previous
        // language, and the next successful change re-sends it.
        void updateCurrentUser({ locale: next === SYSTEM_PREFERENCE ? null : language })
            .catch(() => undefined);

        await writeLanguagePreference(next);
    }, []);

    return {
        preference,
        systemEndonym: endonymFor(resolveDeviceLanguage(deviceLanguageTags())),
        setPreference,
    };
};
