import { useEffect } from 'react';

import { useAuth } from 'src/context/auth/AuthContext';
import { getCurrentUserSettings, updateCurrentUser } from 'src/api/users';
import { i18next, deviceLanguageTags } from './index';
import { isSupportedTag } from './languages';
import { languageSubtag, resolveLanguage, SYSTEM_PREFERENCE } from './resolve';
import { readLanguagePreference, writeLanguagePreference } from './storage';

/**
 * Reconciles the language the account holds with the one this install has.
 *
 * Push copy is written by the server, from `locale` on the account. The app's
 * own language is read from AsyncStorage, which is per-install. Those two can
 * disagree, and the case that matters is a reinstall or a second device: the
 * account still says Français, the fresh install has nothing stored and falls
 * back to the device, and the user gets an English interface with French
 * reminders.
 *
 * The rule is deliberately one-directional and narrow. A stored preference is
 * always authoritative, because it is the thing the user last touched on this
 * device, and it is pushed up. Only when this install has no preference at all
 * is the account's choice adopted, which is exactly the reinstall case and
 * cannot overwrite anything.
 *
 * Runs once per signed-in session rather than on every foreground. Unlike the
 * time zone, a language does not change while the user is walking around, and
 * LanguageGate already re-resolves "System" against the device on resume.
 */
export function useLanguageSync(): void {
    const { isAuthenticated, user } = useAuth();
    const userId = isAuthenticated ? user?.id : undefined;

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        void (async () => {
            try {
                const stored = await readLanguagePreference();
                if (cancelled) return;

                if (stored !== SYSTEM_PREFERENCE) {
                    // This device has an explicit choice. Make sure the account
                    // agrees, so the next reminder is written in it.
                    await updateCurrentUser({ locale: stored });
                    return;
                }

                const settings = await getCurrentUserSettings();
                if (cancelled) return;

                const accountChoice = settings.locale;
                if (accountChoice === undefined) return;

                // A tag this build cannot render must not be adopted: it would
                // pin the interface to a language with no resource file while
                // the account keeps sending pushes in it.
                const language = languageSubtag(accountChoice);
                if (!isSupportedTag(language)) return;

                await writeLanguagePreference(language);
                if (cancelled) return;
                await i18next.changeLanguage(
                    resolveLanguage(language, deviceLanguageTags()),
                );
            } catch (err) {
                // A failed reconciliation leaves both sides as they were, which
                // is the state the app was already running in. It is retried on
                // the next sign-in.
                console.warn('[LanguageSync] Could not reconcile language:', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);
}
