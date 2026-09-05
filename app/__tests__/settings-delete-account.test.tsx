import React from 'react';
import { jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import type { AppAlertOptions } from '../../src/context/alert/types';

// Delete account now lives on the Settings category page, not the index.
import AccountSettingsScreen from '../account';
import { deleteCurrentUser } from '../../src/api/users';
import { clearNotesForUser } from '../../src/features/notes/useNotes';

const mockShowAlert = jest.fn();
const mockSignOut = jest.fn(async () => {});

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        signOut: mockSignOut,
    }),
}));

jest.mock('../../src/api/users', () => ({
    deleteCurrentUser: jest.fn(),
}));

jest.mock('../../src/features/notes/useNotes', () => ({
    clearNotesForUser: jest.fn(),
}));

jest.mock('../../src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: View,
        SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{ children }</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

jest.mock('../../src/components/SettingsRow', () => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return {
        SettingsRow: ({ text, onPress }: { text: string; onPress: () => void }) => (
            <Pressable accessibilityRole="button" onPress={ onPress }>
                <Text>{ text }</Text>
            </Pressable>
        ),
    };
});

jest.mock('../../src/components/ui/GlassMorphismWithCircle', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        GlassMorphismWithCircle: ({ children }: { children?: React.ReactNode }) => (
            <View>{ children }</View>
        ),
    };
});

jest.mock('src/components/ui/LinearGradientCircle', () => ({
    __esModule: true,
    default: () => null,
    CirclePosition: {
        TOP_RIGHT: 'TOP_RIGHT',
        BOTTOM_LEFT: 'BOTTOM_LEFT',
    },
}));

const mockedDeleteCurrentUser = jest.mocked(deleteCurrentUser);
const mockedClearNotesForUser = jest.mocked(clearNotesForUser);

/**
 * Presses "Delete account" and confirms the destructive alert action,
 * returning once the confirmation handler has settled.
 */
const confirmAccountDeletion = async (getByText: (text: string) => unknown) => {
    fireEvent.press(getByText('Delete account') as never);

    const alertCall = mockShowAlert.mock.calls.find(([title]) => title === 'Delete account');
    expect(alertCall).toBeDefined();
    const options = alertCall?.[2] as {
        primaryAction: { onPress: () => Promise<void> | void };
    };

    await act(async () => {
        await options.primaryAction.onPress();
    });
};

describe('SettingsScreen account deletion', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => { jest.restoreAllMocks(); });

    it('warns that Apple billing continues and offers subscription management before deletion', async () => {
        const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
        const { getByText } = render(<AccountSettingsScreen />);
        fireEvent.press(getByText('Delete account'));

        const [title, message, rawOptions] = mockShowAlert.mock.calls[0];
        const options = rawOptions as AppAlertOptions;
        expect(title).toBe('Delete account');
        expect(message).toContain('does not cancel an App Store subscription or free trial');
        expect(message).toContain('Apple billing will continue');
        expect(options.primaryAction?.label).toBe('Delete account');
        expect(options.secondaryAction?.label).toBe('Manage subscription');

        await act(async () => { await options.secondaryAction?.onPress(); });
        expect(openURL).toHaveBeenCalledWith('https://apps.apple.com/account/subscriptions');
        expect(mockedDeleteCurrentUser).not.toHaveBeenCalled();
        expect(mockedClearNotesForUser).not.toHaveBeenCalled();
    });

    it('provides cancellation instructions if subscription management cannot open', async () => {
        jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('unavailable'));
        const { getByText } = render(<AccountSettingsScreen />);
        fireEvent.press(getByText('Delete account'));
        const options = mockShowAlert.mock.calls[0][2] as AppAlertOptions;
        await act(async () => { await options.secondaryAction?.onPress(); });

        expect(mockShowAlert).toHaveBeenLastCalledWith('Unable to open subscriptions', expect.stringContaining('then Subscriptions'));
        expect(mockedDeleteCurrentUser).not.toHaveBeenCalled();
    });

    it('allows logout from account settings without touching notes or deleting the account', async () => {
        const { getByText } = render(<AccountSettingsScreen />);
        await act(async () => { fireEvent.press(getByText('Log out')); });

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockedDeleteCurrentUser).not.toHaveBeenCalled();
        expect(mockedClearNotesForUser).not.toHaveBeenCalled();
    });

    it('deletes the server account before destroying local notes, then signs out', async () => {
        mockedDeleteCurrentUser.mockResolvedValueOnce(undefined);
        mockedClearNotesForUser.mockResolvedValueOnce(undefined);

        const { getByText } = render(<AccountSettingsScreen />);
        await confirmAccountDeletion(getByText);

        expect(mockedDeleteCurrentUser).toHaveBeenCalledTimes(1);
        expect(mockedClearNotesForUser).toHaveBeenCalledWith('user-1');
        expect(mockSignOut).toHaveBeenCalledTimes(1);

        // Local notes are irrecoverable, so the server must confirm first.
        const deleteOrder = mockedDeleteCurrentUser.mock.invocationCallOrder[0];
        const clearOrder = mockedClearNotesForUser.mock.invocationCallOrder[0];
        expect(deleteOrder).toBeLessThan(clearOrder);
    });

    it('keeps local notes when the server deletion fails', async () => {
        mockedDeleteCurrentUser.mockRejectedValueOnce(new Error('Network request failed'));

        const { getByText } = render(<AccountSettingsScreen />);
        await confirmAccountDeletion(getByText);

        expect(mockedClearNotesForUser).not.toHaveBeenCalled();
        expect(mockSignOut).not.toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Network request failed');
    });

    it('still signs out when local note cleanup fails after a successful deletion', async () => {
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        mockedDeleteCurrentUser.mockResolvedValueOnce(undefined);
        mockedClearNotesForUser.mockRejectedValueOnce(new Error('sqlite unavailable'));

        const { getByText } = render(<AccountSettingsScreen />);
        await confirmAccountDeletion(getByText);

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith(
            '[Settings] Failed to clear local notes after account deletion:',
            expect.any(Error),
        );
        warning.mockRestore();
    });
});
