import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { cancelOnboardingReminder, readNotificationPermission, requestNotificationPermission } from '../onboardingNotifications';
import { cancelNotificationById } from '../../../services/notifications';
const mockCapture = jest.fn();
let mockAnalyticsGeneration = 0;

jest.mock('../../analytics/client', () => ({
    analytics: {
        beginOperation: () => {
            const generation = mockAnalyticsGeneration;
            return { capture: (...args: unknown[]) => {
                if (generation === mockAnalyticsGeneration) mockCapture(...args);
            } };
        },
    },
}));

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
    mockAnalyticsGeneration = 0;
    mockCancel.mockResolvedValue(undefined);
});

describe('notification permission analytics', () => {
    it.each(['granted', 'denied', 'undetermined'] as const)('records the actual %s permission outcome without treating denial as an error', async (status) => {
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce({ status, canAskAgain: false } as never);
        await requestNotificationPermission({ entryPoint: 'settings' });
        expect(mockCapture.mock.calls).toEqual([
            ['notification_setup_result', {
                stage: 'permission', entry_point: 'settings', outcome: status === 'undetermined' ? 'not_determined' : status,
            }],
        ]);
    });

    it('does not report a permission result for a passive read or after an account switch', async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({ status: 'granted', canAskAgain: true } as never);
        await readNotificationPermission();
        expect(mockCapture).not.toHaveBeenCalled();

        let resolvePermission!: (permission: unknown) => void;
        jest.mocked(Notifications.requestPermissionsAsync).mockImplementationOnce(() => new Promise((resolve) => {
            resolvePermission = resolve as (permission: unknown) => void;
        }));
        const result = requestNotificationPermission();
        mockAnalyticsGeneration += 1;
        resolvePermission({ status: 'granted', canAskAgain: true });
        await result;
        expect(mockCapture).not.toHaveBeenCalled();
    });
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
