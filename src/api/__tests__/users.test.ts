import { getCurrentUserSettings, updateCurrentUser } from '../users';
import * as clientModule from '../client';

jest.mock('../client', () => ({
    apiDelete: jest.fn(),
    apiGet: jest.fn(),
    apiPatch: jest.fn(),
}));

const { apiGet, apiPatch } = jest.mocked(clientModule);

describe('user settings API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reads the onboarding and reminder preferences owned by the backend', async () => {
        apiGet.mockResolvedValue({
            user: {
                timeZone: 'Europe/London',
                morningReminderMinutes: 390,
                eveningReminderMinutes: 1335,
                reflectionGoal: 'prepare',
                onboardingCompleted: true,
            },
        });

        await expect(getCurrentUserSettings()).resolves.toEqual({
            timeZone: 'Europe/London',
            morningReminderMinutes: 390,
            eveningReminderMinutes: 1335,
            reflectionGoal: 'prepare',
            onboardingCompleted: true,
        });
        expect(apiGet).toHaveBeenCalledWith('/api/users/me');
    });

    it('saves the complete set of onboarding-owned account settings', async () => {
        apiPatch.mockResolvedValue(undefined);

        await updateCurrentUser({
            morningReminderMinutes: 555,
            eveningReminderMinutes: 1275,
            reflectionGoal: 'habit',
            onboardingCompleted: true,
        });

        expect(apiPatch).toHaveBeenCalledWith(
            '/api/users/me',
            {
                morningReminderMinutes: 555,
                eveningReminderMinutes: 1275,
                reflectionGoal: 'habit',
                onboardingCompleted: true,
            },
            { parseJson: false },
        );
    });
});
