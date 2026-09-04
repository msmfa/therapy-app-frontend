import * as SecureStore from 'expo-secure-store';
import { cancelOnboardingReminder } from '../onboardingNotifications';
import { cancelNotificationById } from '../../../services/notifications';

jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
}));

jest.mock('../../../services/notifications', () => ({
    cancelNotificationById: jest.fn(),
}));

jest.mock('expo-secure-store', () => {
    const store = new Map<string, string>();
    return {
        __store: store,
        getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
        setItemAsync: jest.fn((key: string, value: string) => {
            store.set(key, value);
            return Promise.resolve();
        }),
        deleteItemAsync: jest.fn((key: string) => {
            store.delete(key);
            return Promise.resolve();
        }),
    };
});

const store = (SecureStore as unknown as { __store: Map<string, string> }).__store;
const mockCancel = jest.mocked(cancelNotificationById);

beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    mockCancel.mockResolvedValue(undefined);
});

describe('cancelOnboardingReminder', () => {
    it('cancels and forgets a local reminder left by an older app build', async () => {
        store.set('onboarding.localReminder.v1', 'legacy-reminder-id');

        await cancelOnboardingReminder();

        expect(mockCancel).toHaveBeenCalledWith('legacy-reminder-id');
        expect(store.size).toBe(0);
    });

    it('does nothing when there is nothing booked', async () => {
        await cancelOnboardingReminder();

        expect(mockCancel).not.toHaveBeenCalled();
    });
});
