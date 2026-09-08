import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

let mockUser: { id: string } | null = null;
let mockAuthHydrated = true;
const mockGetCurrentUserSettings = jest.fn();
const mockUpdateCurrentUser = jest.fn();

jest.mock('../auth/AuthContext', () => ({
    useAuth: () => ({ user: mockUser, hydrated: mockAuthHydrated }),
}));

jest.mock('../../api/users', () => ({
    getCurrentUserSettings: (...args: unknown[]) => mockGetCurrentUserSettings(...args),
    updateCurrentUser: (...args: unknown[]) => mockUpdateCurrentUser(...args),
}));

import {
    OnboardingCompletionError,
    OnboardingProvider,
    useOnboarding,
} from '../onboarding/OnboardingContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{ children }</OnboardingProvider>
);

describe('OnboardingProvider', () => {
    beforeEach(async () => {
        mockUser = null;
        mockAuthHydrated = true;
        jest.clearAllMocks();
        jest.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
        jest.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue(undefined);
        jest.mocked(AsyncStorage.removeItem).mockReset().mockResolvedValue(undefined);
        mockGetCurrentUserSettings.mockResolvedValue({ onboardingCompleted: false });
        mockUpdateCurrentUser.mockResolvedValue(undefined);
        await AsyncStorage.clear();
    });

    it('does not let a slow previous account overwrite the current account', async () => {
        let resolveFirst!: (value: string | null) => void;
        const getItem = jest.mocked(AsyncStorage.getItem);
        getItem
            .mockImplementationOnce(() => new Promise((resolve) => {
                resolveFirst = resolve;
            }))
            .mockResolvedValueOnce('1');

        mockUser = { id: 'user-a' };
        const { result, rerender } = renderHook(() => useOnboarding(), { wrapper });

        await waitFor(() => expect(getItem).toHaveBeenCalledWith('onboarding:v1:user-a'));

        mockUser = { id: 'user-b' };
        rerender(undefined);

        // No render may expose user A's completion flag as hydrated for B.
        expect(result.current.hydrated).toBe(false);

        await waitFor(() => {
            expect(getItem).toHaveBeenCalledWith('onboarding:v1:user-b');
            expect(result.current.hydrated).toBe(true);
            expect(result.current.hasOnboarded).toBe(true);
        });

        await act(async () => resolveFirst(null));

        expect(result.current.hasOnboarded).toBe(true);
    });

    it('rejects completion when there is no signed-in user', async () => {
        const { result } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        await expect(result.current.finishOnboarding()).rejects.toMatchObject({
            name: 'OnboardingCompletionError',
            reason: 'no_user',
        } satisfies Partial<OnboardingCompletionError>);
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
    });

    it('restores completion from the account on a new device', async () => {
        mockUser = { id: 'returning-user' };
        mockGetCurrentUserSettings.mockResolvedValue({ onboardingCompleted: true });

        const { result } = renderHook(() => useOnboarding(), { wrapper });

        await waitFor(() => {
            expect(result.current.hydrated).toBe(true);
            expect(result.current.hasOnboarded).toBe(true);
        });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'onboarding:v1:returning-user',
            '1',
        );
    });

    it('backfills an existing device-only completion marker to the account', async () => {
        mockUser = { id: 'legacy-user' };
        jest.mocked(AsyncStorage.getItem).mockResolvedValue('1');

        const { result } = renderHook(() => useOnboarding(), { wrapper });

        await waitFor(() => {
            expect(result.current.hasOnboarded).toBe(true);
            expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
                onboardingCompleted: true,
            });
        });
    });

    it('does not backfill a device marker into an account selected later', async () => {
        let resolveOldSettings!: (value: { onboardingCompleted: boolean }) => void;
        mockGetCurrentUserSettings
            .mockImplementationOnce(() => new Promise((resolve) => {
                resolveOldSettings = resolve;
            }))
            .mockResolvedValueOnce({ onboardingCompleted: false });
        jest.mocked(AsyncStorage.getItem)
            .mockResolvedValueOnce('1')
            .mockResolvedValueOnce(null);

        mockUser = { id: 'old-user' };
        const { result, rerender } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hasOnboarded).toBe(true));

        mockUser = { id: 'new-user' };
        rerender(undefined);
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        await act(async () => resolveOldSettings({ onboardingCompleted: false }));

        expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
        expect(result.current.hasOnboarded).toBe(false);
    });

    it('requires the account write before marking onboarding complete', async () => {
        mockUser = { id: 'user-a' };
        const { result } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        await act(async () => result.current.finishOnboarding());

        expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ onboardingCompleted: true });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('onboarding:v1:user-a', '1');
        expect(result.current.hasOnboarded).toBe(true);
    });

    it('stays incomplete when the account completion write fails', async () => {
        const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockUser = { id: 'user-a' };
        const { result } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        mockUpdateCurrentUser.mockRejectedValueOnce(new Error('offline'));

        await expect(result.current.finishOnboarding()).rejects.toMatchObject({
            name: 'OnboardingCompletionError',
            reason: 'server',
        } satisfies Partial<OnboardingCompletionError>);

        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        expect(result.current.hasOnboarded).toBe(false);
        errorLog.mockRestore();
    });

    it('resets both the account and local completion markers', async () => {
        mockUser = { id: 'user-a' };
        jest.mocked(AsyncStorage.getItem).mockResolvedValue('1');
        mockGetCurrentUserSettings.mockResolvedValue({ onboardingCompleted: true });
        const { result } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hasOnboarded).toBe(true));

        await act(async () => result.current.resetOnboarding());

        expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ onboardingCompleted: false });
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('onboarding:v1:user-a');
        expect(result.current.hasOnboarded).toBe(false);
    });

    it('does not mark a new account complete when the previous write finishes late', async () => {
        mockUser = { id: 'user-a' };
        const { result, rerender } = renderHook(() => useOnboarding(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        let resolveWrite!: () => void;
        jest.mocked(AsyncStorage.setItem).mockImplementationOnce(() => new Promise((resolve) => {
            resolveWrite = resolve;
        }));
        const completion = result.current.finishOnboarding();

        mockUser = { id: 'user-b' };
        rerender(undefined);
        await waitFor(() => {
            expect(AsyncStorage.getItem).toHaveBeenCalledWith('onboarding:v1:user-b');
            expect(result.current.hydrated).toBe(true);
            expect(result.current.hasOnboarded).toBe(false);
        });

        await act(async () => {
            resolveWrite();
            await completion;
        });

        expect(result.current.hasOnboarded).toBe(false);
    });
});
