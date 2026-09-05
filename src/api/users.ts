import { ApiError, apiDelete, apiGet, apiPatch } from './client';
import type { GoalId } from '../features/onboarding/onboardingCopy';

export const deleteCurrentUser = async (): Promise<void> => {
    try {
        await apiDelete<void>('/api/users/me', { parseJson: false });
    } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 'apple_reauthentication_required') throw error;
        const AppleAuthentication = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
        const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
        if (!credential.authorizationCode) throw new Error('Apple confirmation was incomplete. Please try again.');
        await apiDelete<void>('/api/users/me', {
            body: { appleAuthorizationCode: credential.authorizationCode },
            parseJson: false,
            timeoutMs: 30_000,
        });
    }
};

export type UpdateCurrentUserInput = {
    /** IANA identifier, e.g. "Europe/London". */
    timeZone?: string;
    /**
     * Reminder times as minutes from local midnight: 07:30 is 450, 20:15 is
     * 1215. Minutes rather than an hour because the app lets people choose a
     * time, and the backend schedules against exactly what is stored here.
     */
    morningReminderMinutes?: number;
    eveningReminderMinutes?: number;
    /** Ongoing note-writing focus chosen during onboarding. */
    reflectionGoal?: GoalId;
    /** Server marker used to restore completion on another device. */
    onboardingCompleted?: boolean;
};

export type CurrentUserSettings = {
    morningReminderMinutes?: number;
    eveningReminderMinutes?: number;
    reflectionGoal?: GoalId;
    onboardingCompleted?: boolean;
    timeZone?: string;
};

type CurrentUserResponse = {
    user: CurrentUserSettings;
};

/** Reads the server-owned preferences shown in Settings. */
export const getCurrentUserSettings = async (): Promise<CurrentUserSettings> => {
    const response = await apiGet<CurrentUserResponse>('/api/users/me');
    return response.user;
};

/**
 * The backend schedules reminders against the user's local wall clock, so it
 * needs to know which zone that is. Without it every reminder is placed in UTC.
 */
export const updateCurrentUser = async (
    input: UpdateCurrentUserInput,
): Promise<void> => {
    await apiPatch<void>('/api/users/me', input, { parseJson: false });
};
