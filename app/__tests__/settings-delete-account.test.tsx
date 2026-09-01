import React from 'react';
import { jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';

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
        mockedDeleteCurrentUser.mockResolvedValueOnce(undefined);
        mockedClearNotesForUser.mockRejectedValueOnce(new Error('sqlite unavailable'));

        const { getByText } = render(<AccountSettingsScreen />);
        await confirmAccountDeletion(getByText);

        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
});
