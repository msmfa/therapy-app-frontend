import * as Notifications from 'expo-notifications';
import { registerDeviceToken, unregisterDeviceToken } from '../../../api/devices';
import {
    ensurePushRegistration,
    hasRegisteredPushToken,
    resetPushRegistrationState,
    unregisterCurrentPushDevice,
} from '../pushRegistration';

let mockTokenListener: ((token: { data: string }) => void) | null = null;
const mockListenerRemove = jest.fn();
const mockCapture = jest.fn();
let mockAnalyticsGeneration = 0;

jest.mock('../../../features/analytics/client', () => ({
    analytics: {
        getVisitId: () => 'test-visit',
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
    getExpoPushTokenAsync: jest.fn(),
    addPushTokenListener: jest.fn((listener: (token: { data: string }) => void) => {
        mockTokenListener = listener;
        return { remove: mockListenerRemove };
    }),
}));

jest.mock('expo-device', () => ({ isDevice: true }));

jest.mock('expo-constants', () => ({
    default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
}));

jest.mock('../../../api/devices', () => ({
    registerDeviceToken: jest.fn(),
    unregisterDeviceToken: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
    withScope: (callback: (scope: unknown) => void) => callback({
        setTag: jest.fn(),
        setContext: jest.fn(),
    }),
    captureException: jest.fn(),
}));

const mockGetPermissions = jest.mocked(Notifications.getPermissionsAsync);
const mockGetPushToken = jest.mocked(Notifications.getExpoPushTokenAsync);
const mockRegister = jest.mocked(registerDeviceToken);
const mockUnregister = jest.mocked(unregisterDeviceToken);

describe('shared push registration', () => {
    beforeEach(() => {
        resetPushRegistrationState();
        jest.clearAllMocks();
        mockAnalyticsGeneration = 0;
        mockTokenListener = null;
        mockGetPermissions.mockResolvedValue({ status: 'granted' } as never);
        mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[first]' } as never);
        mockRegister.mockResolvedValue(undefined);
        mockUnregister.mockResolvedValue(undefined);
    });

    it('never asks for permission and registers only after permission exists', async () => {
        mockGetPermissions.mockResolvedValue({ status: 'denied' } as never);

        await expect(ensurePushRegistration()).resolves.toEqual({ status: 'permission_denied' });

        expect(mockGetPushToken).not.toHaveBeenCalled();
        expect(mockRegister).not.toHaveBeenCalled();
        expect(hasRegisteredPushToken()).toBe(false);
    });

    it('deduplicates concurrent registration and repeated foreground checks', async () => {
        const first = ensurePushRegistration();
        const second = ensurePushRegistration();

        await expect(Promise.all([first, second])).resolves.toEqual([
            { status: 'registered', token: 'ExponentPushToken[first]' },
            { status: 'registered', token: 'ExponentPushToken[first]' },
        ]);
        await expect(ensurePushRegistration()).resolves.toEqual({
            status: 'registered',
            token: 'ExponentPushToken[first]',
        });

        expect(mockGetPushToken).toHaveBeenCalledTimes(1);
        expect(mockRegister).toHaveBeenCalledTimes(1);
        expect(Notifications.addPushTokenListener).toHaveBeenCalledTimes(1);
        expect(mockCapture.mock.calls).toEqual([
            ['notification_setup_result', {
                stage: 'registration', entry_point: 'app_start', outcome: 'registered',
            }, undefined],
        ]);
    });

    it('reports failed registration only after the backend rejects, without a token or payload', async () => {
        mockRegister.mockRejectedValueOnce(new Error('private token and backend payload'));
        await expect(ensurePushRegistration({ entryPoint: 'onboarding' })).resolves.toEqual({ status: 'failed' });
        expect(mockCapture.mock.calls).toEqual([
            ['notification_setup_result', { stage: 'registration', entry_point: 'onboarding', outcome: 'failed' }, undefined],
            ['critical_action_failed', { operation: 'notification_registration', error_code: 'unknown' }],
        ]);
    });

    it('drops a registration result if consent or analytics identity changed during the backend write', async () => {
        let complete!: () => void;
        let started!: () => void;
        const writing = new Promise<void>((resolve) => { started = resolve; });
        mockRegister.mockImplementationOnce(() => new Promise<void>((resolve) => {
            complete = resolve;
            started();
        }));
        const registration = ensurePushRegistration({ entryPoint: 'settings' });
        await writing;
        expect(mockCapture).not.toHaveBeenCalled();
        mockAnalyticsGeneration += 1;
        complete();
        await registration;
        expect(mockCapture).not.toHaveBeenCalled();
    });

    it('replaces a rotated token and removes the obsolete backend row', async () => {
        await ensurePushRegistration();
        expect(mockTokenListener).not.toBeNull();
        mockGetPushToken.mockResolvedValueOnce({
            data: 'ExponentPushToken[second]',
        } as never);

        // The native event carries an APNs token. The service must exchange it
        // for the new Expo token rather than registering this native value.
        mockTokenListener?.({ data: 'native-apns-token' });
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(mockRegister).toHaveBeenLastCalledWith(
            'ExponentPushToken[second]',
            expect.stringMatching(/^(ios|android)$/),
        );
        expect(mockUnregister).toHaveBeenCalledWith('ExponentPushToken[first]');
    });

    it('unregisters when permission is revoked in Settings', async () => {
        await ensurePushRegistration();
        mockGetPermissions.mockResolvedValue({ status: 'denied' } as never);

        await expect(ensurePushRegistration()).resolves.toEqual({ status: 'permission_denied' });

        expect(mockUnregister).toHaveBeenCalledWith('ExponentPushToken[first]');
        expect(mockListenerRemove).toHaveBeenCalledTimes(1);
        expect(hasRegisteredPushToken()).toBe(false);
    });

    it('removes the registered device while logout credentials are still available', async () => {
        await ensurePushRegistration();

        await unregisterCurrentPushDevice();

        expect(mockUnregister).toHaveBeenCalledWith('ExponentPushToken[first]');
        expect(mockListenerRemove).toHaveBeenCalledTimes(1);
        expect(hasRegisteredPushToken()).toBe(false);
    });

    it('does not attach a late token lookup to a different signed-in account', async () => {
        let resolveToken!: (value: { data: string }) => void;
        mockGetPushToken.mockImplementationOnce(() => new Promise((resolve) => {
            resolveToken = resolve;
        }) as never);

        const oldAccountRegistration = ensurePushRegistration();
        await Promise.resolve();
        resetPushRegistrationState();
        resolveToken({ data: 'ExponentPushToken[late]' });

        await expect(oldAccountRegistration).resolves.toEqual({ status: 'failed' });
        expect(mockRegister).not.toHaveBeenCalled();
        expect(hasRegisteredPushToken()).toBe(false);
    });
});
