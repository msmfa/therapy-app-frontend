import { useEffect, useState } from 'react';
import { getCurrentUserSettings } from '../../api/users';
import { DEFAULT_NOTE_PROMPT, notePromptForGoal } from './reflectionGoalPrompt';

/** Reads the account-owned onboarding goal without making note entry depend on the network. */
export const useNotePrompt = (userId: string | undefined): string => {
    const [prompt, setPrompt] = useState({ userId, text: DEFAULT_NOTE_PROMPT });

    useEffect(() => {
        let cancelled = false;
        setPrompt({ userId, text: DEFAULT_NOTE_PROMPT });

        if (!userId) return () => {
            cancelled = true;
        };

        void getCurrentUserSettings()
            .then((settings) => {
                if (!cancelled) setPrompt({ userId, text: notePromptForGoal(settings.reflectionGoal) });
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

    // Effects run after render, so hide the previous account's loaded prompt
    // synchronously while the new account's settings are being requested.
    return prompt.userId === userId ? prompt.text : DEFAULT_NOTE_PROMPT;
};
