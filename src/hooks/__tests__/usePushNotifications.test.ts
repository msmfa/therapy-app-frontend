import { renderHook, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../usePushNotifications';
import { registerDeviceToken, unregisterDeviceToken } from 'src/api/devices';
import { resetPushRegistrationState } from '../../services/notifications/pushRegistration';

// ---------------------------------------------------------------------------
// Auth context mock — isAuthenticated is read at call time so tests can flip it
// ---------------------------------------------------------------------------

let mockIsAuthenticated = false;

// Stands in for AuthProvider's task registry. `runSignOutTasks` plays the part
// of signOut(), which runs the tasks while the session is still valid.
const signOutTasks = new Set<() => Promise<void>>();

const mockRegisterSignOutTask = (task: () => Promise<void>) => {
  signOutTasks.add(task);
  return () => {
    signOutTasks.delete(task);
  };
};

const runSignOutTasks = async () => {
  await Promise.allSettled(Array.from(signOutTasks).map((task) => task()));
};

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
    registerSignOutTask: mockRegisterSignOutTask,
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
    resetPushRegistrationState();
    jest.clearAllMocks();
    signOutTasks.clear();
    mockIsAuthenticated = false;
    // Default: listener returns a removable subscription
    mockAddTokenListener.mockReturnValue({ remove: jest.fn() } as any);
    mockRegister.mockResolvedValue(undefined);
    mockUnregister.mockResolvedValue(undefined);
  });

  it('never raises the system permission prompt from app startup', async () => {
    // The prompt belongs to the onboarding notification step, where the user has
    // been told what the reminders are and has asked for them. Raising it on
    // launch spends the one refusal iOS lets you have.
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[perm-test]' } as any);

    renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('registers no token while permission is merely undetermined', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[perm-test]' } as any);

    renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRegister).not.toHaveBeenCalled();
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

    // signOut() drains the cleanup tasks before it clears the credentials.
    await act(async () => {
      await runSignOutTasks();
    });

    expect(mockUnregister).toHaveBeenCalledWith('ExponentPushToken[logout-test]');

    // ...and only then does isAuthenticated flip.
    mockIsAuthenticated = false;
    rerender({} as any);

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUnregister).toHaveBeenCalledTimes(1);
  });

  it('registers exactly one cleanup task and releases it on unmount', async () => {
    mockIsAuthenticated = true;
    mockGetPermissions.mockResolvedValue({ status: 'granted' } as any);
    mockGetPushToken.mockResolvedValue({ data: 'ExponentPushToken[cleanup]' } as any);

    const { unmount } = renderHook(() => usePushNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(signOutTasks.size).toBe(1);

    unmount();

    expect(signOutTasks.size).toBe(0);
  });
});
