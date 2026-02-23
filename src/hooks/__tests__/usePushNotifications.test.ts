import { renderHook, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../usePushNotifications';
import { registerDeviceToken, unregisterDeviceToken } from 'src/api/devices';

// ---------------------------------------------------------------------------
// Auth context mock — isAuthenticated is read at call time so tests can flip it
// ---------------------------------------------------------------------------

let mockIsAuthenticated = false;

jest.mock('src/context/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    token: mockIsAuthenticated ? 'test-token' : null,
    refreshToken: null,
    user: mockIsAuthenticated ? { id: 'user-1', email: 'a@b.com', name: 'A' } : null,
    hydrated: true,
    setAuth: jest.fn(),
    refreshSession: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// expo-notifications mock
// ---------------------------------------------------------------------------

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

// ---------------------------------------------------------------------------
// expo-device — always report a real device so the token flow runs
// ---------------------------------------------------------------------------

jest.mock('expo-device', () => ({ isDevice: true }));

// ---------------------------------------------------------------------------
// expo-constants — supply a fake projectId
// ---------------------------------------------------------------------------

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: { eas: { projectId: 'test-project-id' } },
    },
  },
}));

// ---------------------------------------------------------------------------
// Device token API
// ---------------------------------------------------------------------------

jest.mock('src/api/devices', () => ({
  registerDeviceToken: jest.fn(),
  unregisterDeviceToken: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Typed references
// ---------------------------------------------------------------------------

const mockGetPermissions = jest.mocked(Notifications.getPermissionsAsync);
const mockRequestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const mockGetPushToken = jest.mocked(Notifications.getExpoPushTokenAsync);
const mockAddTokenListener = jest.mocked(Notifications.addPushTokenListener);
const mockRegister = jest.mocked(registerDeviceToken);
const mockUnregister = jest.mocked(unregisterDeviceToken);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = false;
    // Default: listener returns a removable subscription
    mockAddTokenListener.mockReturnValue({ remove: jest.fn() } as any);
    mockRegister.mockResolvedValue(undefined);
    mockUnregister.mockResolvedValue(undefined);
  });

  it('requests notification permissions when user is authenticated', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' } as any);
    mockRequestPermissions.mockResolvedValue({ status: 'granted' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[perm-test]' } as any);

    renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('sends push token to the backend after permissions are granted', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'granted' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[register-test]' } as any);

    renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRegister).toHaveBeenCalledWith(
      'ExponentPushToken[register-test]',
      expect.stringMatching(/^(ios|android)$/),
    );
  });

  it('does not call the backend API when the user denies permissions', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'denied' } as any);
    mockRequestPermissions.mockResolvedValue({ status: 'denied' } as any);

    renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('does not throw when permissions are denied', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'denied' } as any);
    mockRequestPermissions.mockResolvedValue({ status: 'denied' } as any);

    const { unmount } = renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    // Reaching here without an unhandled error means the hook didn't throw
    expect(mockRegister).not.toHaveBeenCalled();
    unmount();
  });

  it('calls DELETE /api/devices with the registered token on logout', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'granted' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[logout-test]' } as any);

    const { rerender } = renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    // Token should have been registered
    expect(mockRegister).toHaveBeenCalledWith('ExponentPushToken[logout-test]', expect.any(String));

    // Simulate logout
    mockIsAuthenticated = false;
    rerender({} as any);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUnregister).toHaveBeenCalledWith('ExponentPushToken[logout-test]');
  });
});
