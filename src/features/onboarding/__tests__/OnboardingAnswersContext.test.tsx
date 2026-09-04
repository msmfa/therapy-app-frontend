import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockReadDraft = jest.fn();
const mockPromoteAnonDraft = jest.fn();
const mockWriteDraft = jest.fn();
const mockClearDraft = jest.fn();
const mockCancelOnboardingReminder = jest.fn();
const mockRegisterSignOutTask = jest.fn(() => jest.fn());

let mockUser: { id: string } | null = null;
let mockAuthHydrated = true;
let mockSegments: string[] = ['(tabs)', 'index'];

jest.mock('expo-router', () => ({
    useSegments: () => mockSegments,
}));

jest.mock('../../../context/auth/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        hydrated: mockAuthHydrated,
        registerSignOutTask: mockRegisterSignOutTask,
    }),
}));

jest.mock('../draftStore', () => ({
    readDraft: (...args: unknown[]) => mockReadDraft(...args),
    promoteAnonDraft: (...args: unknown[]) => mockPromoteAnonDraft(...args),
    writeDraft: (...args: unknown[]) => mockWriteDraft(...args),
    clearDraft: (...args: unknown[]) => mockClearDraft(...args),
}));

jest.mock('../onboardingNotifications', () => ({
    cancelOnboardingReminder: (...args: unknown[]) => mockCancelOnboardingReminder(...args),
}));

import {
    OnboardingAnswersProvider,
    useOnboardingAnswers,
} from '../OnboardingAnswersContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingAnswersProvider>{ children }</OnboardingAnswersProvider>
);

describe('OnboardingAnswersProvider persistence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = null;
        mockAuthHydrated = true;
        mockSegments = ['(tabs)', 'index'];
        mockReadDraft.mockResolvedValue(null);
        mockPromoteAnonDraft.mockResolvedValue(null);
        mockWriteDraft.mockResolvedValue(undefined);
        mockClearDraft.mockResolvedValue(undefined);
        mockCancelOnboardingReminder.mockResolvedValue(undefined);
    });

    it('records the focused onboarding screen in the encrypted draft', async () => {
        const { rerender } = renderHook(() => useOnboardingAnswers(), { wrapper });
        await waitFor(() => expect(mockReadDraft).toHaveBeenCalled());

        mockSegments = ['(onboarding)', 'plan-preview'];
        rerender({});

        await waitFor(() => expect(mockWriteDraft).toHaveBeenCalledWith(
            null,
            expect.objectContaining({ resumeRoute: '/(onboarding)/plan-preview' }),
        ));
    });

    it('writes rapid answers in order so an older value cannot win', async () => {
        let releaseFirst!: () => void;
        mockWriteDraft
            .mockImplementationOnce(() => new Promise<void>((resolve) => {
                releaseFirst = resolve;
            }))
            .mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useOnboardingAnswers(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        act(() => {
            result.current.setAnswer('goal', 'remember');
            result.current.setAnswer('goal', 'practise');
        });

        await waitFor(() => expect(mockWriteDraft).toHaveBeenCalledTimes(1));
        expect(mockWriteDraft.mock.calls[0][1]).toMatchObject({ goal: 'remember' });

        await act(async () => {
            releaseFirst();
        });

        await waitFor(() => expect(mockWriteDraft).toHaveBeenCalledTimes(2));
        expect(mockWriteDraft.mock.calls[1][1]).toMatchObject({ goal: 'practise' });
    });

    it('waits for pending saves before clearing the completed draft', async () => {
        let releaseWrite!: () => void;
        mockWriteDraft.mockImplementationOnce(() => new Promise<void>((resolve) => {
            releaseWrite = resolve;
        }));

        const { result } = renderHook(() => useOnboardingAnswers(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        act(() => result.current.setAnswer('goal', 'remember'));
        await waitFor(() => expect(mockWriteDraft).toHaveBeenCalledTimes(1));

        let discard!: Promise<void>;
        act(() => {
            discard = result.current.discardDraft();
        });
        expect(mockClearDraft).not.toHaveBeenCalled();

        await act(async () => {
            releaseWrite();
            await discard;
        });

        expect(mockClearDraft).toHaveBeenCalledWith(null);
        expect(mockCancelOnboardingReminder).toHaveBeenCalledTimes(1);
        expect(mockWriteDraft.mock.invocationCallOrder[0])
            .toBeLessThan(mockClearDraft.mock.invocationCallOrder[0]);
    });

    it('does not promote an anonymous draft before its pending save finishes', async () => {
        let releaseWrite!: () => void;
        mockWriteDraft.mockImplementationOnce(() => new Promise<void>((resolve) => {
            releaseWrite = resolve;
        }));

        const { result, rerender } = renderHook(() => useOnboardingAnswers(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));
        act(() => result.current.setAnswer('goal', 'remember'));
        await waitFor(() => expect(mockWriteDraft).toHaveBeenCalledTimes(1));

        mockUser = { id: 'user-a' };
        rerender({});

        expect(result.current.hydrated).toBe(false);
        expect(mockPromoteAnonDraft).not.toHaveBeenCalled();

        await act(async () => {
            releaseWrite();
        });

        await waitFor(() => expect(mockPromoteAnonDraft).toHaveBeenCalledWith('user-a'));
        await waitFor(() => expect(result.current.hydrated).toBe(true));
    });

    it('does not block completion when a legacy local reminder cannot be removed', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        mockCancelOnboardingReminder.mockRejectedValue(new Error('native cleanup failed'));

        const { result } = renderHook(() => useOnboardingAnswers(), { wrapper });
        await waitFor(() => expect(result.current.hydrated).toBe(true));

        await act(async () => {
            await result.current.discardDraft();
        });
        expect(mockClearDraft).toHaveBeenCalledWith(null);
        expect(warn).toHaveBeenCalledWith(
            '[onboarding] could not remove legacy reminder:',
            expect.any(Error),
        );
        warn.mockRestore();
    });
});
