import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getCurrentUserSettings } from '../../api/users';
import { notePromptKeyForGoal } from './reflectionGoalPrompt';

/**
 * Reads the account-owned onboarding goal without making note entry depend on
 * the network.
 *
 * State holds the goal, not the sentence. Storing the resolved prompt would
 * fix it in the language the screen mounted in, and the effect only re-runs
 * when the account changes, so a language change would leave the old wording
 * on screen until the user switched accounts.
 */
export const useNotePrompt = (userId: string | undefined): string => {
    const { t } = useTranslation('notes');
    const [goal, setGoal] = useState<{ userId: string | undefined; value: unknown }>({
        userId,
        value: undefined,
    });

    useEffect(() => {
        let cancelled = false;
        setGoal({ userId, value: undefined });

        if (!userId) return () => {
            cancelled = true;
        };

        void getCurrentUserSettings()
            .then((settings) => {
                if (!cancelled) setGoal({ userId, value: settings.reflectionGoal });
            })
            .catch((error) => {
                // Note entry remains fully usable offline; only the optional
                // personalised prompt falls back to the existing copy.
                console.warn('[useNotePrompt] could not load reflection goal:', error);
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // Effects run after render, so hide the previous account's loaded goal
    // synchronously while the new account's settings are being requested.
    const active = goal.userId === userId ? goal.value : undefined;
    return t(notePromptKeyForGoal(active));
};
