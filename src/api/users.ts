import { apiDelete, apiPatch } from './client';

export const deleteCurrentUser = async (): Promise<void> => {
    await apiDelete<void>('/api/users/me', { parseJson: false });
};

export type UpdateCurrentUserInput = {
    /** IANA identifier, e.g. "Europe/London". */
    timeZone?: string;
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
